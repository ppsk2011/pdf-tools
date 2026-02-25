# Web Deployment Guide

This guide walks through deploying PDFTools to the web, from a simple one-click platform all the way to a production VPS with a custom domain, HTTPS, and a CDN.

---

## Table of Contents

1. [Option A — Vercel (Recommended for frontend)](#option-a--vercel)
2. [Option B — Netlify](#option-b--netlify)
3. [Option C — VPS (DigitalOcean / Hetzner / AWS EC2)](#option-c--vps)
4. [Option D — AWS (ECS + CloudFront)](#option-d--aws)
5. [Option E — Google Cloud Run](#option-e--google-cloud-run)
6. [Backend deployment](#backend-deployment)
7. [Database / Redis](#database--redis)
8. [Environment variable checklist](#environment-variable-checklist)

---

## Option A — Vercel

Vercel deploys the React SPA with a global CDN in about two minutes.

### Steps

1. **Push your code** to GitHub (already done).

2. **Import project** at [vercel.com/new](https://vercel.com/new):
   - Select your `pdf-tools` repo.
   - Set **Root Directory** → `frontend`
   - Framework preset: **Vite**

3. **Set environment variables** (Settings → Environment Variables):

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://api.yourdomain.com` |

4. **Deploy** — Vercel runs `npm run build` and serves `dist/`.

5. **Custom domain** (Settings → Domains):
   - Add `yourdomain.com` and `www.yourdomain.com`
   - Vercel gives you the DNS records to add (CNAME / A records)

### Automatic deploys

Every push to `main` triggers a new deployment. Preview deployments are created for each pull request.

---

## Option B — Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**.
2. Connect GitHub, select `pdf-tools`.
3. Build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Add environment variable `VITE_API_URL`.
5. Deploy.
6. **Custom domain**: Site settings → Domain management → Add custom domain.

### `netlify.toml` (already works without this, but enables headers):

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

Add this file at `frontend/netlify.toml` if you use Netlify.

---

## Option C — VPS

Use this for full control, including running the backend on the same server.

### Recommended providers

| Provider | Entry plan | Location |
|---|---|---|
| DigitalOcean Droplets | $6/mo (1 vCPU, 1 GB RAM) | Toronto, New York, etc. |
| Hetzner Cloud | €4/mo (2 vCPU, 2 GB RAM) | Cheapest option |
| Vultr | $6/mo | Multiple regions |

### 1. Provision the server

```bash
# Create a new Ubuntu 22.04 server, then SSH in:
ssh root@YOUR_SERVER_IP
```

### 2. Install dependencies

```bash
# Update system
apt update && apt upgrade -y

# Install Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Install Nginx + Certbot (for SSL)
apt install -y nginx certbot python3-certbot-nginx

# Install Node.js 20 (optional, for running without Docker)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
```

### 3. Clone the repository

```bash
git clone https://github.com/ppsk2011/pdf-tools.git
cd pdf-tools
```

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
nano backend/.env   # Fill in your values
```

### 5. Build and start with Docker Compose

```bash
docker compose up --build -d
```

This starts:
- `frontend` container on port 3000 (nginx serving static files)
- `backend` container on port 3001 (Node.js API)
- `redis` container on port 6379 (internal only)

### 6. Configure Nginx as reverse proxy

```nginx
# /etc/nginx/sites-available/pdftools
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect www → apex
    if ($host = www.yourdomain.com) {
        return 301 https://yourdomain.com$request_uri;
    }

    # Frontend (React SPA)
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 110M;    # match MAX_FILE_SIZE + overhead
        proxy_read_timeout 120s;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/pdftools /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 7. Add SSL with Let's Encrypt (free)

```bash
# Replace with your actual domain
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot auto-configures nginx and sets up auto-renewal
systemctl enable certbot.timer
```

After this, your site is live at `https://yourdomain.com` with a free, auto-renewing certificate.

---

## Option D — AWS

### Architecture

```
Route 53 (DNS)
    │
    ▼
CloudFront (CDN + HTTPS termination)
    ├── /api/* → Application Load Balancer → ECS Fargate (backend)
    └── /*     → S3 Static Website (frontend)
                            │
                         ElastiCache (Redis)
```

### Frontend (S3 + CloudFront)

```bash
# Build
cd frontend
VITE_API_URL=https://api.yourdomain.com npm run build

# Create S3 bucket
aws s3 mb s3://pdftools-frontend --region ca-central-1

# Enable static website hosting
aws s3 website s3://pdftools-frontend \
  --index-document index.html \
  --error-document index.html

# Upload
aws s3 sync dist/ s3://pdftools-frontend --delete \
  --cache-control "public,max-age=31536000,immutable" \
  --exclude "index.html"
aws s3 cp dist/index.html s3://pdftools-frontend/index.html \
  --cache-control "no-cache"

# Create CloudFront distribution pointing to the S3 bucket
# (do this in AWS Console or via CDK/Terraform)
```

### Backend (ECS Fargate)

```bash
# Build & push to ECR
aws ecr create-repository --repository-name pdftools-api
aws ecr get-login-password | docker login --username AWS \
  --password-stdin <ACCOUNT_ID>.dkr.ecr.ca-central-1.amazonaws.com

docker build -t pdftools-api ./backend
docker tag pdftools-api <ACCOUNT_ID>.dkr.ecr.ca-central-1.amazonaws.com/pdftools-api:latest
docker push <ACCOUNT_ID>.dkr.ecr.ca-central-1.amazonaws.com/pdftools-api:latest

# Create ECS cluster, task definition, and service via AWS Console
# or Infrastructure as Code (see infra/ directory)
```

---

## Option E — Google Cloud Run

Cloud Run is serverless and scales to zero — great for cost-efficient deployments.

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build & push backend
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/pdftools-api ./backend

# Deploy
gcloud run deploy pdftools-api \
  --image gcr.io/YOUR_PROJECT_ID/pdftools-api \
  --platform managed \
  --region northamerica-northeast1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --concurrency 80 \
  --set-env-vars NODE_ENV=production,FRONTEND_URL=https://yourdomain.com
```

---

## Backend Deployment

The backend is a standard Node.js/Express app packaged as a Docker image. It can run anywhere Docker runs.

### Standalone Docker

```bash
docker build -t pdftools-api ./backend

docker run -d \
  --name pdftools-api \
  --restart unless-stopped \
  -p 3001:3001 \
  --env-file backend/.env \
  pdftools-api
```

### With PM2 (without Docker)

```bash
npm install -g pm2
cd backend && npm install

pm2 start src/server.js --name pdftools-api --instances max
pm2 save
pm2 startup   # generates systemd service
```

---

## Database / Redis

| Option | Notes |
|---|---|
| **Docker** (included in `docker-compose.yml`) | Development / small deployments |
| **AWS ElastiCache** | Managed, multi-AZ, auto-failover |
| **Redis Cloud** (free tier 30 MB) | Easiest external option |
| **Upstash** (serverless Redis) | Pay-per-request, good for Cloud Run |

```bash
# Upstash example
REDIS_URL=rediss://:password@global-xxx.upstash.io:6380
```

---

## Environment Variable Checklist

Copy `backend/.env.example` to `backend/.env` and fill in every value before deploying.

| Variable | Required | Example |
|---|---|---|
| `PORT` | No | `3001` |
| `NODE_ENV` | Yes | `production` |
| `FRONTEND_URL` | Yes | `https://yourdomain.com` |
| `MAX_FILE_SIZE` | No | `104857600` |
| `FILE_TTL_MS` | No | `1800000` |
| `STRIPE_SECRET_KEY` | For payments | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | For payments | `whsec_...` |
| `REDIS_URL` | Yes | `redis://localhost:6379` |

For the frontend, set `VITE_API_URL` as a build-time env var:
```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```

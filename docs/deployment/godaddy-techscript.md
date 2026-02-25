# Deploying PDFTools to pdf-tools.techscript.ca (GoDaddy DNS)

This guide walks through every step needed to put PDFTools live at
**`https://pdf-tools.techscript.ca`** using GoDaddy as your DNS registrar.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [GoDaddy DNS — add the subdomain record](#2-godaddy-dns--add-the-subdomain-record)
3. [Server setup](#3-server-setup)
4. [Clone & configure the app](#4-clone--configure-the-app)
5. [Build & start with Docker Compose](#5-build--start-with-docker-compose)
6. [Install nginx & obtain an SSL certificate](#6-install-nginx--obtain-an-ssl-certificate)
7. [Enable the nginx site](#7-enable-the-nginx-site)
8. [Verify the deployment](#8-verify-the-deployment)
9. [Keep it running — updates & maintenance](#9-keep-it-running--updates--maintenance)

---

## 1. Prerequisites

| Requirement | Details |
|---|---|
| GoDaddy account | You own `techscript.ca` and can edit its DNS |
| VPS / cloud server | Ubuntu 22.04 recommended (DigitalOcean, Hetzner, AWS EC2, etc.) |
| Server public IPv4 | Note it from your hosting provider's dashboard |
| Open ports on server | TCP 22 (SSH), 80 (HTTP), 443 (HTTPS) |

---

## 2. GoDaddy DNS — add the subdomain record

> **What you're doing**: telling the internet that `pdf-tools.techscript.ca`
> should resolve to your server's IP address.

### Steps in the GoDaddy dashboard

1. Log in to [godaddy.com](https://godaddy.com) → **My Products**.
2. Find **techscript.ca** → click **DNS** (or "Manage DNS").
3. Click **Add New Record**.
4. Fill in the form:

   | Field | Value |
   |---|---|
   | **Type** | `A` |
   | **Name** | `pdf-tools` |
   | **Value** | `YOUR_SERVER_IP` *(e.g. `165.232.100.42`)* |
   | **TTL** | `600` seconds (10 min) — lower = faster propagation |

5. Click **Save**.

> **If GoDaddy shows a CNAME option instead of A**: use `A` because you have a
> fixed IP. If your host gives you a hostname (e.g. Vercel / Railway), use
> `CNAME` with that hostname as the value and set `Name = pdf-tools`.

### DNS propagation

Changes take **a few minutes to up to 48 hours** to propagate. Check with:

```bash
# From your local machine or any terminal
nslookup pdf-tools.techscript.ca
# Should print YOUR_SERVER_IP once propagated

# Or use the online checker
# https://www.whatsmydns.net/#A/pdf-tools.techscript.ca
```

---

## 3. Server setup

SSH into your server and install the required software:

```bash
ssh root@YOUR_SERVER_IP

# Update packages
apt update && apt upgrade -y

# Install Docker + Docker Compose plugin
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# Install nginx + Certbot (for free SSL)
apt install -y nginx certbot python3-certbot-nginx

# Verify installations
docker --version
nginx -v
certbot --version

# Set up firewall — allow only SSH, HTTP, HTTPS; block direct container ports
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp    # frontend container — nginx proxies this
ufw deny 3001/tcp    # backend container  — nginx proxies this
ufw deny 6379/tcp    # Redis — internal only
ufw --force enable
```

---

## 4. Clone & configure the app

```bash
# Clone the repository
git clone https://github.com/ppsk2011/pdf-tools.git
cd pdf-tools

# Create the backend environment file
cp backend/.env.example backend/.env
nano backend/.env
```

Set these values in `backend/.env`:

```ini
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://pdf-tools.techscript.ca
REDIS_URL=redis://redis:6379
MAX_FILE_SIZE=104857600
FILE_TTL_MS=1800000

# Optional — only needed if you use the donation feature
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 5. Build & start with Docker Compose

Use the production override file so the app is built for your subdomain:

```bash
docker compose \
  -f docker-compose.yml \
  -f docker-compose.prod.yml \
  up --build -d
```

This starts three containers:
| Container | Role | Internal port |
|---|---|---|
| `frontend` | React SPA (nginx static) | 3000 |
| `backend` | Node.js / Express API | 3001 |
| `redis` | Job queue & cache | 6379 (internal only) |

Verify all containers are healthy:

```bash
docker compose ps
# All three should show "Up" or "(healthy)"
```

---

## 6. Install nginx & obtain an SSL certificate

### Step 6a — start nginx with a minimal HTTP config

nginx needs to be running so Certbot can complete the ACME domain challenge.
We'll start with a minimal HTTP-only config, get the certificate, then switch to
the full production config.

```bash
# Write a minimal bootstrap config (HTTP only — no SSL lines yet)
cat > /etc/nginx/sites-available/pdf-tools.techscript.ca << 'EOF'
server {
    listen 80;
    server_name pdf-tools.techscript.ca;
    location / {
        proxy_pass http://127.0.0.1:3000;
    }
}
EOF

# Enable the site and remove the default placeholder
ln -s /etc/nginx/sites-available/pdf-tools.techscript.ca \
      /etc/nginx/sites-enabled/pdf-tools.techscript.ca
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
```

### Step 6b — obtain a free SSL certificate (Let's Encrypt)

```bash
certbot --nginx \
  -d pdf-tools.techscript.ca \
  --email you@techscript.ca \
  --agree-tos \
  --no-eff-email
```

Certbot automatically:
- Issues the certificate
- Edits the nginx config to add HTTPS and redirect HTTP→HTTPS
- Sets up a systemd timer for **auto-renewal** — you never need to renew manually

### Step 6c — replace with the full production config

Once the certificate is issued, swap the minimal config for the production-ready
one (which includes security headers, gzip, and proper proxy settings):

```bash
# Copy the full production nginx config from the repo
cp nginx/pdf-tools.techscript.ca.conf /etc/nginx/sites-available/pdf-tools.techscript.ca

nginx -t && systemctl reload nginx
```

### Verify auto-renewal

```bash
certbot renew --dry-run
# Should say "No renewals were attempted" (cert is still fresh)
```

---

## 7. Enable the nginx site

After Certbot runs, reload nginx one final time:

```bash
nginx -t && systemctl reload nginx
```

---

## 8. Verify the deployment

Run this checklist from your local machine:

```bash
# 1. DNS resolves to your server
dig pdf-tools.techscript.ca A +short
# → YOUR_SERVER_IP

# 2. HTTP redirects to HTTPS
curl -I http://pdf-tools.techscript.ca
# → 301 Moved Permanently to https://...

# 3. Frontend loads (HTTP 200 over HTTPS)
curl -I https://pdf-tools.techscript.ca
# → HTTP/2 200

# 4. Backend health check works
curl https://pdf-tools.techscript.ca/health
# → {"status":"ok","env":"production",...}

# 5. SSL grade
# Open in browser: https://www.ssllabs.com/ssltest/analyze.html?d=pdf-tools.techscript.ca
# Should score A or A+

# 6. Security headers
curl -I https://pdf-tools.techscript.ca | grep -i "strict-transport\|x-frame\|x-content"
```

Then open **`https://pdf-tools.techscript.ca`** in your browser — you should
see the PDFTools homepage over HTTPS with a padlock icon. 🎉

---

## 9. Keep it running — updates & maintenance

### Pull and redeploy the latest code

```bash
cd ~/pdf-tools
git pull origin main
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

### View logs

```bash
docker compose logs -f backend    # API logs
docker compose logs -f frontend   # nginx (frontend) logs
```

### Restart a single service

```bash
docker compose restart backend
```

### Stop everything

```bash
docker compose down
```

---

## Summary of the one DNS record you added in GoDaddy

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `pdf-tools` | `YOUR_SERVER_IP` | `600` |

That single record is all GoDaddy needs. Everything else (SSL, routing,
CORS, etc.) is handled on the server side.

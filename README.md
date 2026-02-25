# PDFTools — Production-Grade PDF Processing Platform

A browser-based PDF processing platform equivalent to ilovepdf.com, built with React + TypeScript frontend and Node.js + Express backend. All files are processed in memory and auto-deleted after 30 minutes — zero permanent storage.

[![CI](https://github.com/ppsk2011/pdf-tools/actions/workflows/ci.yml/badge.svg)](https://github.com/ppsk2011/pdf-tools/actions/workflows/ci.yml)

---

## Features

### PDF Operations
- **Merge PDFs** — combine multiple PDFs into one
- **Split PDF** — by page ranges (e.g., `1-3, 5, 7-9`)
- **Compress PDF** — three quality levels (low / medium / high)
- **Rotate Pages** — 90°, 180°, or 270°
- **Extract Pages** — pull specific pages into a new PDF
- **Delete Pages** — remove unwanted pages

### Conversion Engine
- **PDF → JPG** — each page exported as an image
- **JPG / Images → PDF** — combine images into a single PDF
- PDF → Word / PowerPoint / Excel *(requires LibreOffice on server)*

### Security Tools
- **Protect PDF** — AES-256 password encryption
- **Unlock PDF** — remove password from a PDF
- **Watermark** — diagonal text watermark on every page

### UX
- Drag & drop upload with multi-file queue
- Real-time processing progress bars
- Dark / light mode (persisted in localStorage)
- Mobile-first responsive design
- Session-based download history
- Optional donation prompt after successful processing

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React SPA)               │
│  Upload → API call → Poll status → Download result  │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────┐
│              Node.js + Express API                   │
│  Multer (memoryStorage) → pdf-lib → response stream │
│  Rate limiting · CORS · Helmet · Input validation   │
└───────────────────────────────────────────────────┬─┘
                                                    │
┌───────────────────────────────────────────────────▼─┐
│                  Redis (Bull queue)                  │
│          Heavy jobs offloaded to workers            │
└─────────────────────────────────────────────────────┘
```

### Key design decisions
| Concern | Decision | Why |
|---|---|---|
| Backend language | Node.js + Express | Native to pdf-lib; single runtime for sync & async |
| PDF library | pdf-lib | Pure JS, no native deps, works in-memory |
| File storage | **Never persisted** | Files live in `Buffer` only; auto-deleted via TTL |
| Job queue | Bull + Redis | Handles heavy jobs without blocking the HTTP thread |
| Upload | Multer `memoryStorage` | Files never touch disk unless explicitly written |
| Auth | None (stateless) | Ephemeral sessions; no account required |
| Payments | Stripe Payment Links | No card data touches our servers |

---

## Security Model (Zero-Trust File Handling)

| Threat | Mitigation |
|---|---|
| Malicious file upload | MIME-type allowlist + magic-byte validation |
| File size DoS | 100 MB hard limit per file, 20 files max per request |
| Stored data exfiltration | Files never persisted; processed purely in memory |
| API abuse | Rate limiting: 30 req / 15 min / IP on upload routes |
| SSRF / injection | No URL fetch; all input validated with express-validator |
| XSS / clickjacking | Helmet sets CSP, X-Frame-Options, X-Content-Type-Options |
| Stale temp files | Background pruner deletes files older than `FILE_TTL_MS` (30 min) |

---

## Project Structure

```
pdf-tools/
├── frontend/                # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Layout, UI primitives, DonationModal
│   │   ├── hooks/           # useTheme, useFileProcessor
│   │   ├── pages/           # HomePage, tool pages, NotFound
│   │   ├── services/        # api.ts (Axios wrapper)
│   │   └── types/           # Shared TypeScript interfaces
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                 # Node.js + Express
│   ├── src/
│   │   ├── config/          # Environment config
│   │   ├── middleware/      # Upload, security, errorHandler
│   │   ├── routes/          # One file per tool endpoint
│   │   ├── services/        # pdfService, fileService, jobQueue
│   │   └── utils/           # tempFiles, validation
│   └── Dockerfile
│
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for full stack)

### Development

```bash
# Backend
cd backend
cp .env.example .env
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000  
Backend: http://localhost:3001  
Health: http://localhost:3001/health

### Production (Docker)

```bash
# Copy and configure env
cp backend/.env.example backend/.env
# Edit backend/.env with your Stripe keys etc.

docker-compose up --build -d
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/api/merge` | Merge multiple PDFs |
| POST | `/api/split` | Split PDF by page ranges |
| POST | `/api/compress` | Compress PDF |
| POST | `/api/rotate` | Rotate PDF pages |
| POST | `/api/extract-pages` | Extract specific pages |
| POST | `/api/convert` | Convert PDF ↔ images |
| POST | `/api/protect` | Password-protect a PDF |
| POST | `/api/unlock` | Remove PDF password |
| POST | `/api/watermark` | Add text watermark |
| POST | `/api/donate/webhook` | Stripe webhook |

---

## Donation / Payment Integration

After each successful file operation a **DonationModal** is shown (dismissible):

- Three one-time tiers: **$3 · $5 · $10**
- Links to Stripe Payment Links (configure in `DonationModal.tsx`)
- Ko-fi style UX: "Buy us a coffee ☕"
- No forced login, no card data handled by our app

### Stripe Webhook Setup

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3001/api/donate/webhook

# Set env vars
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Deployment

Detailed step-by-step guides live in the [`docs/`](./docs/) folder:

| Guide | What it covers |
|---|---|
| 📖 [Web + Domain Hosting](./docs/deployment/web.md) | Vercel, Netlify, VPS (DigitalOcean/Hetzner), AWS, Google Cloud Run |
| 🌐 [Domain & DNS Setup](./docs/deployment/domain-setup.md) | Register a domain, DNS records, nginx reverse proxy, Let's Encrypt SSL, Cloudflare |
| 🍎 [iOS App (App Store)](./docs/deployment/ios.md) | Capacitor + Xcode + App Store Connect, TestFlight, OTA updates |
| 🤖 [Android App (Google Play)](./docs/deployment/android.md) | Capacitor + Android Studio + Play Console, signed AAB, GitHub Actions CI |

---

### 5-Minute Quick Start (Web)

```bash
# 1. Configure backend environment
cp backend/.env.example backend/.env
#    → set NODE_ENV=production, FRONTEND_URL, STRIPE_*, REDIS_URL

# 2. Build and launch everything
docker compose up --build -d

# Frontend → http://localhost:3000
# Backend  → http://localhost:3001
# Health   → http://localhost:3001/health
```

---

### Deploy to a Custom Domain (VPS)

```bash
# On your Ubuntu VPS
git clone https://github.com/ppsk2011/pdf-tools.git && cd pdf-tools
cp backend/.env.example backend/.env && nano backend/.env
docker compose up --build -d

# Add nginx + Let's Encrypt SSL
apt install -y nginx certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

→ Full nginx config and domain setup: [docs/deployment/domain-setup.md](./docs/deployment/domain-setup.md)

---

### Deploy as iOS or Android App

The React frontend wraps into a native app via **Capacitor** — no code rewrite needed.

```bash
# 1. Install Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2. Build the frontend
cd frontend && VITE_API_URL=https://api.yourdomain.com npm run build && cd ..

# 3. Add platforms
npx cap add ios      # creates ios/ Xcode project
npx cap add android  # creates android/ Gradle project

# 4. Sync web assets into native projects
npx cap sync

# 5. Open in IDE
npx cap open ios      # → Xcode
npx cap open android  # → Android Studio
```

→ Detailed iOS guide (signing, App Store): [docs/deployment/ios.md](./docs/deployment/ios.md)  
→ Detailed Android guide (Play Store, signed AAB): [docs/deployment/android.md](./docs/deployment/android.md)

---

### PWA — Install on Any Device Without an App Store

The frontend is a **Progressive Web App**. Users can install it directly from the browser:

- **iPhone/iPad**: Safari → Share button → "Add to Home Screen"
- **Android**: Chrome → ⋮ menu → "Add to Home Screen" / "Install app"
- **Desktop**: Chrome/Edge → install icon in the address bar

No App Store account needed for PWA distribution.

---

### Scaling Strategy

- **Horizontal**: Run multiple backend containers behind an AWS ALB / nginx upstream. Bull queue workers scale independently.
- **Redis**: Use AWS ElastiCache or [Upstash](https://upstash.com) for managed, serverless Redis.
- **CDN**: Serve the frontend from Cloudfront / Cloudflare to eliminate origin load.
- **Cost floor**: ~$6–8/mo (single Hetzner VPS + Vercel free tier + free Redis).

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | API listen port |
| `NODE_ENV` | `development` | Node environment |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin |
| `MAX_FILE_SIZE` | `104857600` | Max upload size (bytes) |
| `FILE_TTL_MS` | `1800000` | Auto-delete TTL (ms) |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook secret |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection |

---

## License

MIT

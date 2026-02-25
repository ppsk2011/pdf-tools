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

### Frontend — Vercel / Netlify

```bash
# Build
cd frontend && npm run build

# Set env var
VITE_API_URL=https://api.yourpdftools.com
```

### Backend — Docker on any cloud

```dockerfile
# Already included in backend/Dockerfile
docker build -t pdftools-api ./backend
docker run -p 3001:3001 --env-file .env pdftools-api
```

### Scaling Strategy

- **Horizontal**: Run multiple backend containers behind a load balancer (nginx / AWS ALB). Bull queue workers can run as separate pods.
- **Redis**: Use AWS ElastiCache or Redis Cloud for managed Redis.
- **CDN**: Serve the frontend from a CDN (Cloudfront / Fastly) to offload static asset traffic.
- **Cost**: Use spot/preemptible instances for worker nodes; scale-to-zero when idle.

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

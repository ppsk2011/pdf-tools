# PDFTools Deployment Documentation

Complete guides for deploying PDFTools across all platforms.

---

## Platform Guides

| Guide | Description |
|---|---|
| [Web + Domain Hosting](./deployment/web.md) | Deploy to Vercel, Netlify, VPS, AWS, or Google Cloud Run |
| [Domain & DNS Setup](./deployment/domain-setup.md) | Register a domain, configure DNS, set up nginx + SSL |
| [iOS App](./deployment/ios.md) | Build and publish to the Apple App Store via Capacitor |
| [Android App](./deployment/android.md) | Build and publish to Google Play via Capacitor |

---

## Quick Reference

### Which guide do I need?

```
I want to put the website online
└─► docs/deployment/web.md

I need help with my custom domain / SSL
└─► docs/deployment/domain-setup.md

I want a native iPhone/iPad app on the App Store
└─► docs/deployment/ios.md

I want a native Android app on Google Play
└─► docs/deployment/android.md
```

### Deployment stack summary

| Layer | Technology | Hosting option |
|---|---|---|
| Frontend (web) | React + Vite | Vercel · Netlify · nginx on VPS |
| Backend (API) | Node.js + Express | Docker · AWS ECS · Google Cloud Run |
| Cache / Queue | Redis | Docker · AWS ElastiCache · Upstash |
| iOS native | Capacitor + WKWebView | Apple App Store |
| Android native | Capacitor + Android WebView | Google Play |

---

## Minimum Viable Deployment (cheapest path)

1. **Backend**: $6/mo Hetzner VPS running Docker Compose (backend + Redis).
2. **Frontend**: Free Vercel plan (CDN-delivered static files).
3. **Domain**: $9/yr Porkbun `.com` domain.
4. **SSL**: Free Let's Encrypt certificate (auto-renews).
5. **Total monthly cost**: ~$6.75/mo (server) + $0.75/mo (domain amortised).

---

## Environment Variables

See `backend/.env.example` for the full list. Key vars:

```bash
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
REDIS_URL=redis://localhost:6379
```

For the frontend (set at build time):

```bash
VITE_API_URL=https://api.yourdomain.com
```

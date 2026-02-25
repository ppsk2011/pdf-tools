# Domain & DNS Setup Guide

This guide covers registering a domain, configuring DNS records, adding SSL/TLS, and setting up nginx on your server to serve PDFTools at `https://yourdomain.com`.

---

## Table of Contents

1. [Register a domain](#1-register-a-domain)
2. [DNS records](#2-dns-records)
3. [Point domain to your server](#3-point-domain-to-your-server)
4. [Nginx configuration](#4-nginx-configuration)
5. [SSL/TLS with Let's Encrypt](#5-ssltls-with-lets-encrypt)
6. [Using Cloudflare (optional but recommended)](#6-using-cloudflare)
7. [Subdomain strategy](#7-subdomain-strategy)
8. [Verify everything works](#8-verify-everything-works)

---

## 1. Register a Domain

Recommended registrars (Canadian-friendly):

| Registrar | `.com` price | Notes |
|---|---|---|
| [Namecheap](https://namecheap.com) | ~$10/yr | Easy DNS management |
| [Google Domains / Squarespace](https://domains.squarespace.com) | ~$12/yr | Clean UI |
| [Porkbun](https://porkbun.com) | ~$9/yr | Cheapest, free WHOIS privacy |
| [CIRA](https://cira.ca) | ~$15/yr | Canadian registrar, `.ca` domains |
| [GoDaddy](https://godaddy.com) | ~$12/yr | Widely known |

> **Tip**: If you're Canadian, consider a `.ca` domain — it builds local trust and is cheaper via CIRA.

---

## 2. DNS Records

After registering, you'll manage DNS through your registrar's dashboard (or Cloudflare if you transfer nameservers).

### Minimum required records

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` (root / apex) | `YOUR_SERVER_IP` | 300 |
| `A` | `www` | `YOUR_SERVER_IP` | 300 |
| `A` | `api` | `YOUR_SERVER_IP` | 300 |

> If you deploy the backend on a **separate server**, point `api.yourdomain.com` to that server's IP instead.

### Optional records

| Type | Name | Value | Purpose |
|---|---|---|---|
| `AAAA` | `@` | `YOUR_IPv6` | IPv6 support |
| `CAA` | `@` | `0 issue "letsencrypt.org"` | Restrict who can issue SSL certs |
| `TXT` | `@` | `v=spf1 -all` | Block email spoofing (if you don't send email) |

### DNS propagation

DNS changes take **5 minutes to 48 hours** to propagate globally. Check propagation with:

```bash
# Check from your machine
nslookup yourdomain.com
dig yourdomain.com A +short

# Online tools
# https://www.whatsmydns.net
# https://dnschecker.org
```

---

## 3. Point Domain to Your Server

### VPS / Dedicated server

1. Note your server's public IPv4 address (from your hosting provider's dashboard).
2. Set the `A` record for `@` (root) to that IP.
3. Set the `A` record for `www` to the same IP.

### Vercel / Netlify

They give you a **CNAME target** (e.g., `cname.vercel-dns.com`). Add:

| Type | Name | Value |
|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` |
| `A` | `@` | `76.76.21.21` *(Vercel's IP — confirm in their docs)* |

### Split deployment (frontend on Vercel, backend on VPS)

| Record | Points to |
|---|---|
| `yourdomain.com` | Vercel (React SPA) |
| `api.yourdomain.com` | Your VPS (Node.js backend) |

---

## 4. Nginx Configuration

Install nginx on your VPS:

```bash
apt update && apt install -y nginx
```

Create the site config:

```bash
nano /etc/nginx/sites-available/pdftools
```

Paste this complete config (replace `yourdomain.com`):

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com api.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# Frontend — React SPA
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL (filled in by certbot)
    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Redirect www → apex
    if ($host = www.yourdomain.com) {
        return 301 https://yourdomain.com$request_uri;
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Proxy to React SPA container
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

# Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Allow large PDF uploads
    client_max_body_size 110M;
    proxy_read_timeout   120s;
    proxy_send_timeout   120s;

    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it:

```bash
ln -s /etc/nginx/sites-available/pdftools /etc/nginx/sites-enabled/
nginx -t          # test config — must say "syntax is ok"
systemctl reload nginx
```

---

## 5. SSL/TLS with Let's Encrypt

Let's Encrypt provides free, auto-renewing SSL certificates.

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Issue certificates (replace with your domains)
certbot --nginx \
  -d yourdomain.com \
  -d www.yourdomain.com \
  -d api.yourdomain.com \
  --email you@example.com \
  --agree-tos \
  --no-eff-email

# Verify auto-renewal works (dry run)
certbot renew --dry-run
```

Certbot sets up a systemd timer that auto-renews certificates 30 days before expiry. You don't need to do anything else.

### Check your SSL grade

After deployment, test at **[ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)** — you should get an **A+** grade with the config above.

---

## 6. Using Cloudflare

Cloudflare sits in front of your server and provides:
- **Free SSL** (even without Let's Encrypt)
- **DDoS protection** (built-in, free tier)
- **CDN** (global edge caching)
- **Analytics** (without cookies/GDPR issues)
- **Page Rules** (rewrites, redirects)

### Setup

1. Sign up at [cloudflare.com](https://cloudflare.com) (free plan is enough).
2. Add your domain and import DNS records.
3. Cloudflare gives you two nameserver addresses (e.g., `aria.ns.cloudflare.com`).
4. Go to your registrar → change nameservers to the two Cloudflare addresses.
5. Wait for propagation (usually under 30 minutes).

### Recommended Cloudflare settings

| Setting | Value |
|---|---|
| SSL/TLS mode | **Full (strict)** |
| Always Use HTTPS | On |
| HTTP/3 (with QUIC) | On |
| Brotli compression | On |
| Browser Cache TTL | 1 month (for assets) |

### Cloudflare cache rules for the API

Add a **Cache Rule** to bypass cache for API paths:
- URL pattern: `api.yourdomain.com/api/*`
- Cache status: **Bypass**

---

## 7. Subdomain Strategy

Recommended domain structure:

| Subdomain | Points to | Purpose |
|---|---|---|
| `yourdomain.com` | Frontend (Vercel / VPS) | React SPA |
| `api.yourdomain.com` | Backend (VPS / Cloud Run) | Node.js API |
| `status.yourdomain.com` | Uptime monitoring (e.g., Upptime) | Status page |

Single-domain alternative (everything on one VPS):

| Path | Proxy target |
|---|---|
| `yourdomain.com/` | `localhost:3000` (React) |
| `yourdomain.com/api/` | `localhost:3001` (Node API) |
| `yourdomain.com/health` | `localhost:3001/health` |

---

## 8. Verify Everything Works

Run this checklist after deployment:

```bash
# 1. DNS resolves
dig yourdomain.com A +short
# → should print your server IP

# 2. HTTPS works
curl -I https://yourdomain.com
# → HTTP/2 200

# 3. Backend health
curl https://api.yourdomain.com/health
# → {"status":"ok","env":"production",...}

# 4. SSL certificate valid
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com \
  < /dev/null 2>&1 | grep -E "subject|issuer|expiry|Verify"

# 5. Security headers present
curl -I https://yourdomain.com | grep -E "strict-transport|x-frame|x-content"
```

Online tools:
- **SSL test**: https://www.ssllabs.com/ssltest/
- **Security headers**: https://securityheaders.com
- **DNS propagation**: https://www.whatsmydns.net
- **PageSpeed**: https://pagespeed.web.dev

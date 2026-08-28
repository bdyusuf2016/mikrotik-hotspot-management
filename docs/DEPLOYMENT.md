# Free-Tier & VPS Deployment Guide

## Architecture Overview

```
Frontend:  GitHub Pages (100% Free Static Hosting + CDN)
Backend:   Render / Railway / Fly.io / VPS (Free or $5/mo)
Database:  Supabase / Neon / Local PostgreSQL (Free tier available)
MikroTik:  Physical RB951Ui-2HnD (Connected via CloudMikroTik SSTP VPN 10.10.13.38)
```

---

## 1. Deploying the Frontend (GitHub Pages)

1. Push your repository to GitHub.
2. In **Repository Settings** > **Pages**, set Source to **GitHub Actions**.
3. Under **Variables**, add:
   - `VITE_API_BASE_URL`: `https://your-backend.com/api`
4. The workflow in `.github/workflows/deploy-frontend.yml` will automatically build and publish the frontend.

---

## 2. Deploying Backend to Serverless / Free Host

1. Create a PostgreSQL database on **Neon** or **Supabase**.
2. Connect your repository to **Render**, **Railway**, or **Fly.io**.
3. Set root directory to `apps/backend`.
4. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MIKROTIK_CONNECTION_MODE=CONNECTOR_AGENT`).
5. Start command: `npm start`.

---

## 3. VPS Migration (Zero Code Rewrite)

If migrating from Serverless to VPS:
1. Clone repository to `/var/www/hotspot`.
2. Run with PM2:
   ```bash
   pm2 start dist/server.js --name hotspot-backend
   ```
3. Point Nginx reverse proxy to `http://127.0.0.1:4000`.

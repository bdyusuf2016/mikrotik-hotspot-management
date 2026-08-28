# GitHub Pages Deployment Guide

## Overview

The frontend application (`apps/frontend`) is built as a pure static Single Page Application (SPA) using **Vite, React 19, and Tailwind CSS**. It contains **zero backend secrets** and connects to the backend API via HTTPS.

---

## 1. GitHub Repository Configuration

1. In your GitHub repository, navigate to **Settings** > **Pages**.
2. Under **Build and deployment**:
   - **Source**: Select `GitHub Actions`.

---

## 2. Secrets & Environment Variables

Under **Settings** > **Secrets and variables** > **Actions** > **Variables**:
- Add `VITE_API_BASE_URL`: URL of your deployed backend (e.g. `https://api.your-hotspot.com/api` or `https://your-app.onrender.com/api`).

> [!WARNING]
> Never store `MIKROTIK_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`, or `VPN_PASSWORD` in repository variables or frontend build assets. Only public configuration is permitted.

---

## 3. GitHub Actions Pipeline

The workflow defined in `.github/workflows/deploy-frontend.yml` executes on every push to the `main` branch:
1. Checks out repository and installs dependencies via `npm ci`.
2. Runs TypeScript type checking (`npm run typecheck`).
3. Builds `@hotspot/shared` and `@hotspot/frontend`.
4. Uploads static build artifacts from `apps/frontend/dist`.
5. Deploys the static site to GitHub Pages.

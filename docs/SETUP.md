# Local & Production Setup Guide

## 1. Environment Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Copy `.env.example` to root or app folders if needed:
```bash
cp .env.example .env
```

Key environment variables:
```env
PORT=4000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-replace-in-production-min-32-chars
JWT_REFRESH_SECRET=super-secret-jwt-refresh-key-replace-in-production-min-32-chars

# Phase 1 Safe Simulation
MIKROTIK_CONNECTION_MODE=MOCK
MIKROTIK_MOCK_MODE=true

# MikroTik VPN credentials
MIKROTIK_HOST=10.10.13.38
MIKROTIK_API_PORT=8728
MIKROTIK_USERNAME=api_admin
```

---

## 2. Running Locally

### Start Backend
```bash
npm run dev:backend
```
Backend will start on `http://localhost:4000`.

### Start Frontend
```bash
npm run dev:frontend
```
Frontend will be available at `http://localhost:5173`.

### Start Outbound Connector Agent (Optional)
```bash
npm run dev:connector
```

---

## 3. Running Verification & Tests

```bash
# Run Vitest test suite
npm run test

# Type check all workspaces
npm run typecheck

# Production build
npm run build
```

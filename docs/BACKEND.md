# Backend Architecture Guide

## Clean Layered Design

The backend is built with **Fastify, TypeScript, Prisma, and Zod** following a clean, decoupled architecture:

```
[ Request / HTTP ]
       |
       v
[ Controllers & Routes ]  <-- Zod validation & response serialization
       |
       v
[ Services Layer ]        <-- Core business logic, voucher generation, lifecycle
       |
       +-----------------------+
       |                       |
       v                       v
[ Repositories ]       [ MikroTik Adapters ]
(Prisma / PostgreSQL)  (Mock, Direct VPN, Connector Agent)
```

---

## Migration-Ready Decoupling

The backend business logic is completely isolated from cloud vendor SDKs. It can run in:
1. **Serverless Platforms**: Vercel, Render Free Web Service, Railway, Fly.io, Cloudflare.
2. **Standard VPS / Dedicated Servers**: Ubuntu / Debian with PM2 or systemd.
3. **Docker Containers**: Standard Node.js 22 alpine container.

---

## Core Endpoints Summary

- `POST /api/auth/login`: Admin authentication (JWT + Refresh token).
- `GET /api/dashboard/summary`: Aggregated KPI counters, active users, traffic and sales.
- `GET /api/users` & `POST /api/users`: Hotspot subscriber management.
- `GET /api/packages` & `POST /api/packages`: Bandwidth and billing package configuration.
- `POST /api/vouchers/generate`: Bulk voucher generator with QR links.
- `POST /api/connectors/heartbeat`: Outbound agent telemetry and command receiver.
- `GET /api/diagnostics`: Live network, VPN, and router reachability status.

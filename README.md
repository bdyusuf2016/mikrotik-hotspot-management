# MikroTik HotSpot Management System (RouterOS 7)

A modern, production-grade MikroTik HotSpot billing and subscriber management platform built with a **GitHub-First, VPN-isolated, Zero-Trust Architecture**.

Designed for high reliability, minimal infrastructure cost (free-tier serverless or low-cost VPS), and strict protection of your physical MikroTik router.

---

## 🌟 Key Architectural Features

- **GitHub Pages Frontend**: Pure static React 19 + TypeScript + Tailwind CSS dashboard deployed effortlessly with GitHub Actions.
- **VPN-First / Outbound Connector Agent**: No public MikroTik API exposure. Seamlessly integrates with remote SSTP VPNs (`10.10.13.38`) without breaking existing PPPoE or LAN setups.
- **Provider-Agnostic Backend**: Clean layered Fastify + Prisma + Zod architecture ready for Serverless (Vercel/Cloudflare Workers/Render/Railway) or Docker/VPS.
- **Native Bilingual Support**: Default Bangla (বাংলা) and English localized interface.
- **Thermal & A4/A5 Voucher Printing**: Generate single and batch vouchers with dynamic QR codes for instant captive portal login.
- **Safe Mock Simulation Engine**: Complete RouterOS 7.24.1 in-memory emulator for development and automated testing without touching physical hardware.

---

## 🏗️ System Architecture

```
                    +------------------------------------+
                    |  GitHub Pages (React 19 Frontend)  |
                    +-----------------+------------------+
                                      | HTTPS (JWT Auth)
                                      v
                    +-----------------+------------------+
                    | Fastify Node.js / Serverless API   |
                    +--------+------------------+--------+
                             |                  |
                    +--------v-------+  +-------v--------+
                    |  PostgreSQL DB |  | Router Adapter |
                    +----------------+  +-------+--------+
                                                |
                 +------------------------------+-----------------------------+
                 |                              |                             |
          [ MODE 1: Direct VPN ]      [ MODE 2: Connector Agent ]       [ MODE 3: Mock ]
                 |                              |                             |
                 | (SSTP 10.10.13.38)           | (Outbound WSS/HTTPS)        | (Simulated ROS 7)
                 v                              v                             v
      +----------+-----------+       +----------+----------+        +---------+----------+
      | Physical MikroTik    |       | Local PC / Raspberry|        | In-Memory Engine   |
      | RB951Ui-2HnD Router  |       | Pi on SSTP VPN      |        | (Zero Network Risk)|
      +----------------------+       +----------+----------+        +--------------------+
                                                |
                                                v
                                     +----------+----------+
                                     | Physical MikroTik   |
                                     | RB951Ui-2HnD Router |
                                     +---------------------+
```

---

## 📁 Repository Structure

```
.
├── .github/workflows/       # GitHub Pages automated CI/CD pipeline
├── apps/
│   ├── frontend/            # React 19 + Vite + Tailwind CSS static SPA
│   ├── backend/             # Fastify + TypeScript API with Mock & Live Adapters
│   ├── connector/           # Lightweight outbound VPN agent
│   └── captive-portal/      # Static responsive MikroTik login.html template
├── packages/
│   └── shared/              # Shared types, Zod schemas, constants, and protocols
├── prisma/
│   └── schema.prisma        # Complete PostgreSQL relational schema
├── docs/                    # Full technical documentation suite
└── package.json             # NPM workspaces root
```

---

## ⚡ Quick Start (Phase 1 Mock Mode)

### 1. Prerequisites
- Node.js >= 20.x (Node 22 recommended)
- npm >= 10.x

### 2. Installation & Setup
```bash
# Clone the repository
git clone https://github.com/your-username/mikrotik-hotspot-management-system.git
cd "mikrotik-hotspot-management-system"

# Install all workspace dependencies
npm install

# Run backend in Mock Mode
npm run dev:backend

# In another terminal, run frontend
npm run dev:frontend
```

### 3. Demo Login Credentials
- **Super Admin**: Username `admin` | Password `Admin@1234`
- **Field Operator**: Username `operator` | Password `Operator@1234`

---

## 📚 Complete Documentation Suite

- [Local & Production Setup Guide](docs/SETUP.md)
- [GitHub Pages Deployment Guide](docs/GITHUB_PAGES.md)
- [Backend Clean Architecture](docs/BACKEND.md)
- [MikroTik RouterOS 7 Safety & Configuration](docs/MIKROTIK.md)
- [VPN Topology & Routing Strategy](docs/VPN.md)
- [Connector Agent Protocol & Deployment](docs/CONNECTOR.md)
- [Security & Zero-Trust Policies](docs/SECURITY.md)
- [Free-Tier & VPS Deployment Guide](docs/DEPLOYMENT.md)
- [Troubleshooting & Diagnostics](docs/TROUBLESHOOTING.md)

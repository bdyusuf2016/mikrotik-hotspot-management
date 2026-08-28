# VPN Topology & Routing Strategy

## Overview

Remote management of the MikroTik router is routed through the **CloudMikroTik SSTP VPN** (`10.10.13.38`).

Because serverless runtimes outside the VPN cannot directly route traffic into private IP subnets (`10.10.13.0/24`), three operational modes are supported:

---

## Connection Modes

### Mode 1: Backend Direct VPN (`BACKEND_DIRECT_VPN`)
- Used when the backend server is running on a VPS or machine with direct SSTP/WireGuard tunnel into `10.10.13.0/24`.
- Backend talks directly to `10.10.13.38:8728`.

### Mode 2: Connector Agent (`CONNECTOR_AGENT`) - Recommended for Serverless
- Used when backend is deployed on free-tier serverless platforms (Vercel, Render, Railway).
- A lightweight Node.js agent (`apps/connector`) runs on any local computer/Raspberry Pi connected to the SSTP VPN.
- Connector dials **outbound** over HTTPS to the backend, receives commands, executes them locally against `10.10.13.38`, and returns the results.
- **Zero inbound ports needed** on the local device or router.

### Mode 3: Mock Mode (`MOCK`)
- Fully simulated RouterOS 7 in-memory engine for local development and CI/CD without touching hardware.

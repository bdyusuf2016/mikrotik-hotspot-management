# Connector Agent Protocol & Deployment

## Purpose

The **Connector Agent** (`apps/connector`) provides a secure bridge between a serverless cloud backend and a VPN-isolated MikroTik router (`10.10.13.38`).

---

## Key Security Features

- **Outbound-Only Communication**: The connector agent initiates all connections over HTTPS. It never listens on any open public port.
- **HMAC / SHA-256 Token Authentication**: Every connector agent has an independent `connectorId` and hashed `tokenHash`.
- **Token Rotation & Revocation**: Tokens can be rotated or revoked on demand from the admin dashboard.
- **Heartbeat & Health Telemetry**: Sends periodic health checks (default 15s) with latency and reachability stats.

---

## Running the Connector Agent

```bash
cd apps/connector
npm install

# Configure environment in .env
BACKEND_URL=https://your-backend-api.com/api
CONNECTOR_ID=your-registered-connector-id
CONNECTOR_TOKEN=your-plain-connector-token
MIKROTIK_HOST=10.10.13.38
MIKROTIK_API_PORT=8728

# Start the agent
npm start
```

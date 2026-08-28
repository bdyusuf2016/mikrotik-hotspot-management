# Security & Zero-Trust Policies

## Security Principles

1. **Zero Secret Leakage**: Frontend assets on GitHub Pages never contain database URLs, JWT signing keys, MikroTik passwords, or VPN credentials.
2. **Role-Based Access Control (RBAC)**:
   - `SUPER_ADMIN`: Full system access, connector management, system settings, router configurations.
   - `ADMIN`: User management, packages, vouchers, billing reports.
   - `OPERATOR`: Voucher creation, subscriber lookup, active session disconnects. Restricted from system/router settings.
3. **Password & Token Hashing**: Bcrypt / Argon2 for admin passwords, SHA-256 for connector tokens.
4. **Rate Limiting & Defensive Headers**: Built-in `@fastify/rate-limit` (120 req/min) and `@fastify/helmet` security headers.
5. **No 0.0.0.0/0 API Binding**: RouterOS API is strictly bound to VPN/LAN interfaces.

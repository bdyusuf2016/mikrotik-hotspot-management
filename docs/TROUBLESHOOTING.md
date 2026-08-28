# Troubleshooting & Diagnostics Guide

## Common Issues & Solutions

### 1. MikroTik Shows `UNREACHABLE` or `AUTHENTICATION_FAILED`
- **Cause**: The backend server is running in `BACKEND_DIRECT_VPN` mode but cannot route to `10.10.13.38`.
- **Solution**: Switch `MIKROTIK_CONNECTION_MODE` to `CONNECTOR_AGENT` and start `apps/connector` on a computer connected to the SSTP VPN.

### 2. GitHub Pages Displays Blank Screen or 404 on Refresh
- **Cause**: Assets paths misconfigured or history routing without fallback.
- **Solution**: Verify that `base: './'` is configured in `apps/frontend/vite.config.ts`.

### 3. HotSpot Vouchers Not Redirecting
- **Cause**: Captive portal variables missing.
- **Solution**: Ensure your exported `login.html` retains `$(link-login-only)` in the form action and `$(link-orig)` in the `dst` hidden field.

### 4. CORS Errors on API Calls
- **Cause**: Frontend domain not listed in backend CORS origins.
- **Solution**: In backend `.env`, set `CORS_ORIGIN=*` or include your GitHub Pages origin (e.g. `https://your-username.github.io`).

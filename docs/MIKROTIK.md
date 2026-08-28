# MikroTik RouterOS 7 Configuration & Safety Protocol

## User Environment Baseline

- **Hardware**: MikroTik RB951Ui-2HnD
- **RouterOS**: 7.24.1 (Stable)
- **WAN**: PPPoE Interface `ISP`
- **LAN**: `192.168.10.0/24` (Gateway: `192.168.10.1`)
- **HotSpot Subnet**: `10.20.20.0/24` (Gateway: `10.20.20.1`, Interface: `bridge-hotspot`, Server: `hotspot1`)
- **Remote VPN**: SSTP Interface `REEMOTE_ACCESS`, VPN IP `10.10.13.38` (CloudMikroTik)

---

## ⚠️ Mandatory Safety Rules

1. **Zero Interference**: The system must NEVER modify or delete:
   - PPPoE connection (`ISP`)
   - Office LAN bridge (`192.168.10.0/24`)
   - SSTP VPN tunnel (`REEMOTE_ACCESS`)
   - Default firewall NAT & Filter rules
2. **Dedicated API User**: Never use the default `admin` account. In Phase 3, create a restricted group:
   ```routeros
   /user group add name=api_hotspot_group policy=read,write,test,api,!ftp,!reboot,!policy,!sensitive
   /user add name=api_hotspot_admin group=api_hotspot_group password="REPLACE_STRONG_PASSWORD" allowed-address=10.10.13.0/24
   ```
3. **No Public API Exposure**: The RouterOS API service (`8728` or `8729`) must only listen on the VPN interface or local bridge:
   ```routeros
   /ip service set api address=10.10.13.0/24,192.168.10.0/24 disabled=no
   ```

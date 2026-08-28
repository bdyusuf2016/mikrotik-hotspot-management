import { ForbiddenError } from './errors.js';

export class RouterSafetyGuard {
  private static readonly ALLOWED_WRITE_PREFIXES = [
    '/ip/hotspot/user',
    '/ip/hotspot/user/profile',
    '/ip/hotspot/active/remove',
    '/ip/hotspot/cookie/remove'
  ];

  private static readonly FORBIDDEN_WRITE_PREFIXES = [
    '/interface/pppoe-client',
    '/interface/sstp-client',
    '/interface/bridge',
    '/interface/ethernet',
    '/interface/wireless',
    '/ip/firewall',
    '/ip/address',
    '/ip/route',
    '/ip/dns',
    '/ip/dhcp-server',
    '/system/reboot',
    '/system/reset-configuration',
    '/system/routerboard'
  ];

  public static assertSafeCommand(path: string, isWriteOperation = false): void {
    const normalized = path.toLowerCase().trim();

    if (!isWriteOperation) {
      return;
    }

    for (const forbidden of this.FORBIDDEN_WRITE_PREFIXES) {
      if (normalized.startsWith(forbidden)) {
        throw new ForbiddenError(
          `SAFETY GUARD VIOLATION: Write operation to '${path}' is strictly forbidden to protect existing networks (PPPoE, VPN, LAN, Bridges).`
        );
      }
    }

    const isAllowed = this.ALLOWED_WRITE_PREFIXES.some(allowed => normalized.startsWith(allowed));
    if (!isAllowed) {
      throw new ForbiddenError(
        `SAFETY GUARD VIOLATION: Target path '${path}' is not within authorized HotSpot user/profile write boundaries.`
      );
    }
  }
}

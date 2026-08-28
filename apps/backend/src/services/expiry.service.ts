import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';

export class ExpiryService {
  private isSweepRunning = false;

  private getAdapter() {
    return MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);
  }

  public async runExpirySweep(adminUsername = 'SYSTEM'): Promise<{ expiredCount: number; checkedCount: number }> {
    if (this.isSweepRunning) {
      return { expiredCount: 0, checkedCount: 0 };
    }
    this.isSweepRunning = true;
    await dbStore.initialize();

    const now = new Date();
    let expiredCount = 0;
    const mikrotik = this.getAdapter();
    const users = Array.from(dbStore.users.values());
    const vouchers = Array.from(dbStore.vouchers.values());

    // 1. Sweep regular hotspot users
    for (const user of users) {
      if (user.status === 'ACTIVE' && user.expiresAt) {
        const expiryDate = new Date(user.expiresAt);
        if (expiryDate <= now) {
          try {
            await mikrotik.disableHotspotUser(user.username);
            await mikrotik.disconnectSession(user.username);

            user.status = 'EXPIRED';
            user.updatedAt = now.toISOString();
            dbStore.users.set(user.id, user);
            expiredCount++;

            dbStore.logAudit({
              adminUsername,
              action: 'ACCOUNT_EXPIRED',
              entity: 'HotspotUser',
              entityId: user.id,
              metadata: {
                username: user.username,
                expiredAt: user.expiresAt,
                note: 'Disabled via automated Expiry Sweep'
              }
            });
          } catch (err) {
            console.error(`Failed to disable expired user ${user.username}:`, (err as Error).message);
          }
        }
      }
    }

    // 2. Sweep vouchers
    for (const voucher of vouchers) {
      if (voucher.status === 'ACTIVATED' && voucher.expiresAt) {
        const expiryDate = new Date(voucher.expiresAt);
        if (expiryDate <= now) {
          try {
            await mikrotik.disableHotspotUser(voucher.code);
            await mikrotik.disconnectSession(voucher.code);

            voucher.status = 'EXPIRED';
            dbStore.vouchers.set(voucher.id, voucher);
            expiredCount++;

            dbStore.logAudit({
              adminUsername,
              action: 'VOUCHER_EXPIRED',
              entity: 'HotspotVoucher',
              entityId: voucher.id,
              metadata: {
                code: voucher.code,
                expiredAt: voucher.expiresAt
              }
            });
          } catch (err) {
            console.error(`Failed to disable expired voucher ${voucher.code}:`, (err as Error).message);
          }
        }
      }
    }

    this.isSweepRunning = false;
    return {
      expiredCount,
      checkedCount: users.length + vouchers.length
    };
  }

  public startBackgroundWorker(intervalMs = 60000): NodeJS.Timeout {
    return setInterval(() => {
      this.runExpirySweep('EXPIRY_WORKER').catch(console.error);
    }, intervalMs);
  }
}

export const expiryService = new ExpiryService();

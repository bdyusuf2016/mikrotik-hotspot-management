import { dbStore } from '../repositories/index.js';
import { generateSecureVoucherCode, generateNumericPassword } from '../core/security.js';
import { NotFoundError } from '../core/errors.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import type { VoucherGenerateInput, HotspotVoucher } from '@hotspot/shared';

function getRouterLimitUptime(durationMinutes: number): string {
  if (!durationMinutes || durationMinutes <= 0) return '1d';
  if (durationMinutes % 1440 === 0) {
    return `${durationMinutes / 1440}d`;
  }
  if (durationMinutes % 60 === 0) {
    return `${durationMinutes / 60}h`;
  }
  return `${durationMinutes * 60}s`;
}

export class VoucherService {
  private getAdapter() {
    return MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);
  }

  async getAllVouchers(packageId?: string, status?: string): Promise<HotspotVoucher[]> {
    await dbStore.initialize();
    
    // Sync voucher status with real-time RouterOS active sessions and usage
    try {
      const mikrotik = this.getAdapter();
      const [activeSessions, routerUsers] = await Promise.all([
        mikrotik.getActiveSessions().catch(() => []),
        mikrotik.getHotspotUsers().catch(() => [])
      ]);

      const activeUsernames = new Set(activeSessions.map(s => s.username.toLowerCase()));
      const userUsageMap = new Map<string, { uptime?: string; bytesIn?: number; bytesOut?: number }>();
      for (const u of routerUsers) {
        userUsageMap.set(u.name.toLowerCase(), {
          uptime: u.uptime,
          bytesIn: u.bytesIn,
          bytesOut: u.bytesOut
        });
      }

      const now = new Date();
      for (const v of dbStore.vouchers.values()) {
        const lowerCode = v.code.toLowerCase();
        const isActive = activeUsernames.has(lowerCode);
        const usage = userUsageMap.get(lowerCode);
        const hasUsage = usage && ((usage.uptime && usage.uptime !== '0s') || (usage.bytesIn || 0) > 0 || (usage.bytesOut || 0) > 0);

        if (v.status === 'UNUSED' && (isActive || hasUsage)) {
          const pkg = dbStore.packages.get(v.packageId);
          v.status = 'ACTIVATED';
          v.activatedAt = v.activatedAt || now.toISOString();
          if (pkg && !v.expiresAt) {
            v.expiresAt = new Date(now.getTime() + pkg.durationMinutes * 60000).toISOString();
          }
          dbStore.vouchers.set(v.id, v);
        } else if (v.status === 'ACTIVATED' && v.expiresAt) {
          if (new Date(v.expiresAt) <= now) {
            v.status = 'EXPIRED';
            dbStore.vouchers.set(v.id, v);
          }
        }
      }
    } catch {
      // If router query fails temporarily, serve existing local state
    }

    let vouchers = Array.from(dbStore.vouchers.values());
    if (packageId) vouchers = vouchers.filter(v => v.packageId === packageId);
    if (status && status !== 'ALL') vouchers = vouchers.filter(v => v.status === status);

    return vouchers.map(v => ({
      ...v,
      package: dbStore.packages.get(v.packageId)
    }));
  }

  async generateVouchers(input: VoucherGenerateInput, adminUsername = 'admin'): Promise<HotspotVoucher[]> {
    await dbStore.initialize();
    const pkg = dbStore.packages.get(input.packageId);
    if (!pkg) throw new NotFoundError('Selected package does not exist');

    const mikrotik = this.getAdapter();
    const profileName = `HS-${pkg.downloadMbps}M`;
    const limitUptime = getRouterLimitUptime(pkg.durationMinutes);
    const batchId = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const generated: HotspotVoucher[] = [];

    for (let i = 0; i < input.quantity; i++) {
      const code = generateSecureVoucherCode(input.codeLength, input.prefix);
      const password = input.includePassword ? generateNumericPassword(4) : code;

      // Synchronize directly to MikroTik RouterOS with exact limit-uptime
      await mikrotik.createHotspotUser({
        name: code,
        password: password,
        profile: profileName,
        limitUptime,
        comment: `Voucher: ${pkg.name} | Batch: ${batchId}`
      });

      const voucher: HotspotVoucher = {
        id: `vch-${Date.now()}-${i}`,
        code,
        password,
        packageId: input.packageId,
        package: pkg,
        batchId,
        status: 'UNUSED',
        createdAt: new Date().toISOString()
      };

      dbStore.vouchers.set(voucher.id, voucher);
      generated.push(voucher);
    }

    dbStore.logAudit({
      adminUsername,
      action: 'VOUCHERS_GENERATED',
      entity: 'HotspotVoucher',
      entityId: batchId,
      metadata: { quantity: input.quantity, package: pkg.name, batchId }
    });

    return generated;
  }

  async disableVoucher(id: string, adminUsername = 'admin'): Promise<HotspotVoucher> {
    await dbStore.initialize();
    const voucher = dbStore.vouchers.get(id);
    if (!voucher) throw new NotFoundError('Voucher not found');

    const mikrotik = this.getAdapter();
    await mikrotik.disableHotspotUser(voucher.code);
    await mikrotik.disconnectSession(voucher.code);

    voucher.status = 'DISABLED';
    dbStore.vouchers.set(id, voucher);

    dbStore.logAudit({
      adminUsername,
      action: 'VOUCHER_DISABLED',
      entity: 'HotspotVoucher',
      entityId: voucher.id,
      metadata: { code: voucher.code }
    });

    return voucher;
  }

  async deleteVoucher(id: string, adminUsername = 'admin'): Promise<boolean> {
    await dbStore.initialize();
    const voucher = dbStore.vouchers.get(id);
    if (!voucher) throw new NotFoundError('Voucher not found');

    const mikrotik = this.getAdapter();
    await mikrotik.deleteHotspotUser(voucher.code);
    dbStore.vouchers.delete(id);

    dbStore.logAudit({
      adminUsername,
      action: 'VOUCHER_DELETED',
      entity: 'HotspotVoucher',
      entityId: id,
      metadata: { code: voucher.code }
    });

    return true;
  }

  async deleteBatch(batchId: string, adminUsername = 'admin'): Promise<number> {
    await dbStore.initialize();
    const mikrotik = this.getAdapter();
    let count = 0;

    for (const [id, v] of dbStore.vouchers.entries()) {
      if (v.batchId === batchId) {
        await mikrotik.deleteHotspotUser(v.code).catch(() => {});
        dbStore.vouchers.delete(id);
        count++;
      }
    }

    dbStore.logAudit({
      adminUsername,
      action: 'VOUCHERS_BATCH_DELETED',
      entity: 'HotspotVoucher',
      entityId: batchId,
      metadata: { batchId, deletedCount: count }
    });

    return count;
  }

  async clearAllVouchers(adminUsername = 'admin'): Promise<number> {
    await dbStore.initialize();
    const mikrotik = this.getAdapter();
    const all = Array.from(dbStore.vouchers.values());

    for (const v of all) {
      await mikrotik.deleteHotspotUser(v.code).catch(() => {});
    }

    const count = dbStore.vouchers.size;
    dbStore.vouchers.clear();

    dbStore.logAudit({
      adminUsername,
      action: 'ALL_VOUCHERS_CLEARED',
      entity: 'HotspotVoucher',
      metadata: { clearedCount: count }
    });

    return count;
  }

  async activateVoucher(code: string, username: string): Promise<HotspotVoucher> {
    await dbStore.initialize();
    let found: HotspotVoucher | undefined;
    for (const v of dbStore.vouchers.values()) {
      if (v.code === code) {
        found = v;
        break;
      }
    }

    if (!found || found.status !== 'UNUSED') {
      throw new NotFoundError('Invalid or expired voucher code');
    }

    const pkg = dbStore.packages.get(found.packageId);
    const expiresAt = pkg ? new Date(Date.now() + pkg.durationMinutes * 60000).toISOString() : null;

    found.status = 'ACTIVATED';
    found.activatedBy = username;
    found.activatedAt = new Date().toISOString();
    found.expiresAt = expiresAt;

    dbStore.vouchers.set(found.id, found);
    return found;
  }

  async exportVouchersCsv(packageId?: string): Promise<string> {
    const vouchers = await this.getAllVouchers(packageId);
    const headers = ['Voucher Code', 'Password', 'Package', 'Price (BDT)', 'Status', 'Created At', 'Batch ID'];
    const rows = vouchers.map(v => [
      v.code,
      v.password || '',
      `"${v.package?.name || ''}"`,
      v.package?.price || 0,
      v.status,
      v.createdAt,
      v.batchId || ''
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const voucherService = new VoucherService();

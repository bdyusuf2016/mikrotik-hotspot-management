import { describe, it, expect, beforeAll } from 'vitest';
import { userService } from '../src/services/user.service.js';
import { voucherService } from '../src/services/voucher.service.js';
import { packageService } from '../src/services/package.service.js';
import { dbStore } from '../src/repositories/index.js';

describe('Phase 2 Management Pillars (Users, Packages, Vouchers & Audit)', () => {
  beforeAll(async () => {
    await dbStore.initialize();
  });

  it('should seed all standard package presets (1H, 3H, 6H, 12H, 1D, 3D, 7D, 15D, 30D)', async () => {
    const packages = await packageService.getAllPackages();
    const names = packages.map(p => p.name);
    expect(names).toContain('1 Hour Fast Pass');
    expect(names).toContain('1 Day Unlimited');
    expect(names).toContain('7 Days Weekly Pro');
    expect(names).toContain('30 Days Monthly VIP');
  });

  it('should support resetting hotspot user password', async () => {
    const user = await userService.createUser({
      username: 'reset_test_user',
      password: 'initialPass123',
      packageId: 'pkg-1d'
    });

    const reset = await userService.resetPassword(user.id, 'newSecurePass999');
    expect(reset).toBe(true);

    const audit = dbStore.auditLogs.find(a => a.action === 'USER_PASSWORD_RESET' && a.entityId === user.id);
    expect(audit).toBeDefined();
  });

  it('should block / ban user and record audit log', async () => {
    const user = await userService.createUser({
      username: 'ban_test_user',
      password: 'pass1234',
      packageId: 'pkg-1d'
    });

    const blocked = await userService.blockUser(user.id, 'Suspicious network flooding');
    expect(blocked.status).toBe('BLOCKED');
    expect(blocked.notes).toContain('Suspicious network flooding');

    const audit = dbStore.auditLogs.find(a => a.action === 'USER_BANNED' && a.entityId === user.id);
    expect(audit).toBeDefined();

    const unblocked = await userService.unblockUser(user.id);
    expect(unblocked.status).toBe('ACTIVE');
  });

  it('should export vouchers to valid CSV format', async () => {
    await voucherService.generateVouchers({
      packageId: 'pkg-1d',
      quantity: 3,
      prefix: 'CSV-'
    });

    const csv = await voucherService.exportVouchersCsv();
    expect(csv).toContain('Voucher Code,Password,Package');
    expect(csv).toContain('CSV-');
  });
});

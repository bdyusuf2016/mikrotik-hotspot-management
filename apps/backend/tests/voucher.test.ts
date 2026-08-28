import { describe, it, expect, beforeAll } from 'vitest';
import { voucherService } from '../src/services/voucher.service.js';
import { dbStore } from '../src/repositories/index.js';

describe('Voucher Management Service', () => {
  beforeAll(async () => {
    await dbStore.initialize();
  });

  it('should generate requested quantity of secure formatted vouchers', async () => {
    const vouchers = await voucherService.generateVouchers({
      packageId: 'pkg-1d',
      quantity: 5,
      prefix: 'WIFI-',
      codeLength: 6,
      includePassword: true
    });

    expect(vouchers.length).toBe(5);
    for (const v of vouchers) {
      expect(v.code.startsWith('WIFI-')).toBe(true);
      expect(v.status).toBe('UNUSED');
      expect(v.password).toBeDefined();
    }
  });

  it('should activate an unused voucher successfully', async () => {
    const vouchers = await voucherService.generateVouchers({
      packageId: 'pkg-1d',
      quantity: 1,
      prefix: 'ACT-',
      codeLength: 6,
      includePassword: true
    });

    const target = vouchers[0];
    const activated = await voucherService.activateVoucher(target.code, 'client_device_99');
    expect(activated.status).toBe('ACTIVATED');
    expect(activated.activatedBy).toBe('client_device_99');
    expect(activated.expiresAt).toBeDefined();
  });
});

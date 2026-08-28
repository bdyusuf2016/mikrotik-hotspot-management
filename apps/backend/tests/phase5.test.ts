import { describe, it, expect, beforeAll } from 'vitest';
import { paymentService } from '../src/services/payment.service.js';
import { reportService } from '../src/services/report.service.js';
import { dbStore } from '../src/repositories/index.js';

describe('Phase 5 Financial Reports, Payments, Audit & Settings', () => {
  beforeAll(async () => {
    await dbStore.initialize();
  });

  it('should record a new cash payment and mark as SUCCESS', async () => {
    const payment = await paymentService.recordPayment({
      username: 'cash_subscriber_test',
      packageId: 'pkg-1d',
      amount: 50,
      method: 'CASH'
    }, 'operator');

    expect(payment.id).toBeDefined();
    expect(payment.status).toBe('SUCCESS');
    expect(payment.amount).toBe(50);

    const audit = dbStore.auditLogs.find(a => a.action === 'PAYMENT_RECORDED' && a.entityId === payment.id);
    expect(audit).toBeDefined();
  });

  it('should record an MFS (bKash) payment as PENDING and support verification', async () => {
    const payment = await paymentService.recordPayment({
      username: 'bkash_subscriber_test',
      packageId: 'pkg-7d',
      amount: 250,
      method: 'BKASH',
      transactionId: 'BK99001122',
      senderPhone: '01700112233'
    }, 'operator');

    expect(payment.status).toBe('PENDING');

    const verified = await paymentService.verifyPayment(payment.id, 'admin');
    expect(verified.status).toBe('SUCCESS');
  });

  it('should compute financial sales summary', async () => {
    const report = await reportService.getSalesReport(30);
    expect(report.totalRevenueBDT).toBeGreaterThan(0);
    expect(report.totalTransactions).toBeGreaterThan(0);
    expect(report.breakdownByMethod.CASH).toBeGreaterThanOrEqual(50);
  });

  it('should export sales report as CSV', async () => {
    const csv = await reportService.exportSalesReportCsv();
    expect(csv).toContain('Payment ID,Customer / User,Package,Amount (BDT)');
    expect(csv).toContain('BKASH');
  });
});

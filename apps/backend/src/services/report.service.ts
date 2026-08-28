import { dbStore } from '../repositories/index.js';

export interface SalesReportData {
  period: string;
  totalRevenueBDT: number;
  totalTransactions: number;
  breakdownByMethod: Record<string, number>;
  breakdownByPackage: Array<{ packageName: string; revenueBDT: number; count: number }>;
  recentPayments: Array<{
    id: string;
    username?: string | null;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
}

export class ReportService {
  async getSalesReport(days = 30): Promise<SalesReportData> {
    await dbStore.initialize();
    const payments = Array.from(dbStore.payments.values()).filter(p => p.status === 'SUCCESS');

    let totalRevenueBDT = 0;
    const methodMap: Record<string, number> = { CASH: 0, BKASH: 0, NAGAD: 0, ROCKET: 0, CARD: 0 };
    const pkgMap: Record<string, { revenueBDT: number; count: number }> = {};

    for (const p of payments) {
      totalRevenueBDT += p.amount;
      methodMap[p.method] = (methodMap[p.method] || 0) + p.amount;

      const pkgName = p.packageName || 'Custom Voucher';
      if (!pkgMap[pkgName]) pkgMap[pkgName] = { revenueBDT: 0, count: 0 };
      pkgMap[pkgName].revenueBDT += p.amount;
      pkgMap[pkgName].count += 1;
    }

    return {
      period: `Last ${days} Days`,
      totalRevenueBDT,
      totalTransactions: payments.length,
      breakdownByMethod: methodMap,
      breakdownByPackage: Object.entries(pkgMap).map(([name, stat]) => ({
        packageName: name,
        revenueBDT: stat.revenueBDT,
        count: stat.count
      })),
      recentPayments: payments.slice(0, 10).map(p => ({
        id: p.id,
        username: p.username,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt
      }))
    };
  }

  async exportSalesReportCsv(): Promise<string> {
    await dbStore.initialize();
    const payments = Array.from(dbStore.payments.values());
    const headers = ['Payment ID', 'Customer / User', 'Package', 'Amount (BDT)', 'Method', 'Status', 'TRX ID', 'Date'];
    const rows = payments.map(p => [
      p.id,
      p.username || 'Anonymous',
      `"${p.packageName || 'Direct'}"`,
      p.amount,
      p.method,
      p.status,
      p.transactionId || '',
      p.createdAt
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const reportService = new ReportService();

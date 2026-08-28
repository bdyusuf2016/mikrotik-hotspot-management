import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import type { DashboardSummary } from '@hotspot/shared';

export interface TopConsumer {
  username: string;
  fullName?: string | null;
  packageName?: string | null;
  totalMB: number;
  downloadMB: number;
  uploadMB: number;
  uptimeHours: number;
}

export class DashboardService {
  async getSummary(): Promise<DashboardSummary & { topConsumers: TopConsumer[]; totalBandwidthGB: { download: number; upload: number; total: number } }> {
    await dbStore.initialize();
    const mikrotik = MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);

    const routerStatus = await mikrotik.getRouterStatus();
    const activeSessions = await mikrotik.getActiveSessions();
    const traffic = await mikrotik.getTrafficRates();

    const users = Array.from(dbStore.users.values());
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
    const expiredUsers = users.filter(u => u.status === 'EXPIRED').length;
    const disabledUsers = users.filter(u => u.status === 'DISABLED' || u.status === 'BLOCKED').length;

    const vouchers = Array.from(dbStore.vouchers.values());
    const unusedVouchers = vouchers.filter(v => v.status === 'UNUSED').length;
    const activatedVouchers = vouchers.filter(v => v.status === 'ACTIVATED').length;
    const expiredVouchers = vouchers.filter(v => v.status === 'EXPIRED').length;

    const connectors = Array.from(dbStore.connectors.values());
    const onlineConnectors = connectors.filter(c => c.status === 'ONLINE').length;

    // Real dynamic sales calculation from payments
    const payments = Array.from(dbStore.payments.values()).filter(p => p.status === 'SUCCESS');
    const totalBDT = payments.reduce((sum, p) => sum + p.amount, 0);

    const now = Date.now();
    const oneDayAgo = now - 86400000;
    const thirtyDaysAgo = now - 30 * 86400000;

    const todayBDT = payments
      .filter(p => new Date(p.createdAt).getTime() >= oneDayAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    const monthBDT = payments
      .filter(p => new Date(p.createdAt).getTime() >= thirtyDaysAgo)
      .reduce((sum, p) => sum + p.amount, 0);

    // Traffic timeline
    const trafficHistory = Array.from({ length: 7 }).map((_, i) => {
      const time = new Date(now - (6 - i) * 60000);
      return {
        timestamp: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
        downloadMbps: +(traffic.downloadMbps).toFixed(2),
        uploadMbps: +(traffic.uploadMbps).toFixed(2)
      };
    });

    const packageDistribution = Array.from(dbStore.packages.values()).map(pkg => {
      const count = users.filter(u => u.packageId === pkg.id).length;
      return {
        packageName: pkg.name,
        userCount: count
      };
    });

    // Compute top data consumers
    const topConsumers: TopConsumer[] = users
      .map(u => {
        const dlMB = Math.round(Number(u.bytesOut) / (1024 * 1024));
        const ulMB = Math.round(Number(u.bytesIn) / (1024 * 1024));
        return {
          username: u.username,
          fullName: u.fullName,
          packageName: u.packageName,
          downloadMB: dlMB,
          uploadMB: ulMB,
          totalMB: dlMB + ulMB,
          uptimeHours: +(u.uptime / 3600).toFixed(1)
        };
      })
      .sort((a, b) => b.totalMB - a.totalMB)
      .slice(0, 5);

    const totalDownloadBytes = users.reduce((sum, u) => sum + Number(u.bytesOut), 0);
    const totalUploadBytes = users.reduce((sum, u) => sum + Number(u.bytesIn), 0);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        online: activeSessions.length,
        expired: expiredUsers,
        disabled: disabledUsers
      },
      vouchers: {
        total: vouchers.length,
        unused: unusedVouchers,
        activated: activatedVouchers,
        expired: expiredVouchers
      },
      sales: {
        todayBDT,
        monthBDT,
        totalBDT,
        currency: 'BDT'
      },
      system: {
        router: {
          connected: routerStatus.apiConnected,
          identity: routerStatus.identity,
          cpuLoad: routerStatus.cpuLoad,
          memoryUsagePercent: Math.round(((routerStatus.totalMemoryMB - routerStatus.freeMemoryMB) / routerStatus.totalMemoryMB) * 100)
        },
        vpn: {
          connected: routerStatus.vpnConnected,
          ip: '10.10.13.38'
        },
        connector: {
          online: onlineConnectors > 0,
          activeCount: onlineConnectors
        }
      },
      trafficHistory,
      packageDistribution,
      topConsumers,
      totalBandwidthGB: {
        download: +(totalDownloadBytes / (1024 * 1024 * 1024)).toFixed(2),
        upload: +(totalUploadBytes / (1024 * 1024 * 1024)).toFixed(2),
        total: +((totalDownloadBytes + totalUploadBytes) / (1024 * 1024 * 1024)).toFixed(2)
      }
    };
  }
}

export const dashboardService = new DashboardService();

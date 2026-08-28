import type {
  AdminUser,
  HotspotUser,
  HotspotPackage,
  HotspotVoucher,
  SystemSettings,
  ConnectorStatus,
  PaymentRecord
} from '@hotspot/shared';
import { hashPassword } from '../core/security.js';

export interface ConnectorRecord {
  id: string;
  name: string;
  tokenHash: string;
  status: ConnectorStatus;
  version: string;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminId?: string | null;
  adminUsername?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

class InMemoryDatabaseStore {
  public admins: Map<string, AdminUser & { passwordHash: string }> = new Map();
  public packages: Map<string, HotspotPackage> = new Map();
  public users: Map<string, HotspotUser & { mikrotikPassword?: string }> = new Map();
  public vouchers: Map<string, HotspotVoucher> = new Map();
  public connectors: Map<string, ConnectorRecord> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public auditLogs: AuditLogRecord[] = [];
  public settings: SystemSettings = {
    businessName: 'Yusuf Computer & IT',
    businessTagline: 'স্মার্ট হাই-স্পিড ওয়াইফাই হটস্পট',
    businessLogoUrl: null,
    supportPhone: '01933814200',
    developerCredit: 'Designed & Developed by Yusuf IT',
    currency: 'BDT',
    currencySymbol: '৳',
    timezone: 'Asia/Dhaka',
    voucherPrefix: 'HS-',
    voucherLength: 6,
    defaultPackageId: 'pkg-1d',
    defaultValidityMode: 'FROM_FIRST_LOGIN',
    termsAndConditionsBangla: '১. এই ভাউচার শুধুমাত্র একটি ডিভাইসে ব্যবহার করা যাবে।\n২. প্যাকেজের মেয়াদ প্রথম লগইনের সময় থেকে শুরু হবে।',
    termsAndConditionsEnglish: '1. This voucher is valid for a single device.\n2. Validity period starts from the first login.'
  };

  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    // Seed default admin accounts
    const superAdminHash = await hashPassword('Admin@1234');
    const operatorHash = await hashPassword('Operator@1234');

    this.admins.set('admin-1', {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@hotspot.local',
      fullName: 'System Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      passwordHash: superAdminHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    this.admins.set('admin-2', {
      id: 'admin-2',
      username: 'operator',
      email: 'operator@hotspot.local',
      fullName: 'Field Operator',
      role: 'OPERATOR',
      isActive: true,
      passwordHash: operatorHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Seed standard billing packages
    const defaultPackages: HotspotPackage[] = [
      {
        id: 'pkg-1h',
        name: '1 Hour Fast Pass',
        price: 10,
        durationMinutes: 60,
        downloadMbps: 5,
        uploadMbps: 2,
        sharedUsers: 1,
        validityMode: 'FROM_FIRST_LOGIN',
        rateLimitString: '5M/2M',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pkg-1d',
        name: '1 Day Unlimited',
        price: 50,
        durationMinutes: 1440,
        downloadMbps: 5,
        uploadMbps: 2,
        sharedUsers: 1,
        validityMode: 'FROM_FIRST_LOGIN',
        rateLimitString: '5M/2M',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pkg-7d',
        name: '7 Days Weekly Pro',
        price: 250,
        durationMinutes: 10080,
        downloadMbps: 8,
        uploadMbps: 3,
        sharedUsers: 1,
        validityMode: 'FROM_FIRST_LOGIN',
        rateLimitString: '8M/3M',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pkg-30d',
        name: '30 Days Monthly VIP',
        price: 800,
        durationMinutes: 43200,
        downloadMbps: 10,
        uploadMbps: 5,
        sharedUsers: 2,
        validityMode: 'FROM_FIRST_LOGIN',
        rateLimitString: '10M/5M',
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const pkg of defaultPackages) {
      this.packages.set(pkg.id, pkg);
    }

    this.logAudit({
      adminUsername: 'admin',
      action: 'SYSTEM_STARTUP',
      entity: 'System',
      entityId: 'sys-0',
      metadata: { note: 'Clean HotSpot Management Engine initialized' }
    });

    this.initialized = true;
  }

  public logAudit(entry: {
    adminId?: string | null;
    adminUsername?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }): void {
    const record: AuditLogRecord = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      adminId: entry.adminId || null,
      adminUsername: entry.adminUsername || 'admin',
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId || null,
      metadata: entry.metadata,
      createdAt: new Date().toISOString()
    };
    this.auditLogs.unshift(record);
    if (this.auditLogs.length > 100) {
      this.auditLogs.pop();
    }
  }
}

export const dbStore = new InMemoryDatabaseStore();

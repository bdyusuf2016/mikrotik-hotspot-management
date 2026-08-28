export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR';
export type UserStatus = 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'BLOCKED' | 'UNUSED';
export type VoucherStatus = 'UNUSED' | 'ACTIVATED' | 'EXPIRED' | 'DISABLED';
export type ValidityMode = 'FROM_FIRST_LOGIN' | 'FROM_CREATION' | 'ACCUMULATIVE';
export type ConnectionMode = 'MOCK' | 'BACKEND_DIRECT_VPN' | 'CONNECTOR_AGENT';
export type ConnectorStatus = 'ONLINE' | 'OFFLINE' | 'REVOKED' | 'DISABLED';
export type PaymentMethod = 'CASH' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
export interface PaymentRecord {
    id: string;
    userId?: string | null;
    username?: string | null;
    voucherId?: string | null;
    packageId?: string | null;
    packageName?: string | null;
    amount: number;
    currency: string;
    method: PaymentMethod;
    status: PaymentStatus;
    transactionId?: string | null;
    senderPhone?: string | null;
    recordedByAdmin?: string | null;
    notes?: string | null;
    createdAt: string;
}
export interface AdminUser {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: Role;
    isActive: boolean;
    lastLoginAt?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface HotspotPackage {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    downloadMbps: number;
    uploadMbps: number;
    dataLimitMB?: number | null;
    sharedUsers: number;
    sessionTimeout?: number | null;
    idleTimeout?: number | null;
    validityMode: ValidityMode;
    rateLimitString: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
}
export interface HotspotUser {
    id: string;
    username: string;
    password?: string;
    fullName?: string | null;
    phone?: string | null;
    packageId?: string | null;
    packageName?: string | null;
    profileName: string;
    macAddress?: string | null;
    ipAddress?: string | null;
    startAt?: string | null;
    expiresAt?: string | null;
    status: UserStatus;
    bytesIn: bigint | number;
    bytesOut: bigint | number;
    uptime: number;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}
export interface HotspotVoucher {
    id: string;
    code: string;
    password?: string;
    packageId: string;
    package?: HotspotPackage;
    batchId?: string | null;
    status: VoucherStatus;
    activatedBy?: string | null;
    activatedAt?: string | null;
    expiresAt?: string | null;
    createdAt: string;
}
export interface ActiveSession {
    id: string;
    username: string;
    ipAddress: string;
    macAddress: string;
    loginAt: string;
    uptime: number;
    bytesIn: number;
    bytesOut: number;
    currentRateIn?: number;
    currentRateOut?: number;
    profileName?: string;
    domain?: string;
}
export interface RouterStatus {
    identity: string;
    version: string;
    model: string;
    cpuLoad: number;
    freeMemoryMB: number;
    totalMemoryMB: number;
    freeHddMB: number;
    totalHddMB: number;
    uptime: string;
    boardName: string;
    connectionMode: ConnectionMode;
    isReachable: boolean;
    apiConnected: boolean;
    vpnConnected: boolean;
    lastCheckedAt: string;
}
export interface NetworkDiagnostics {
    backend: {
        status: 'OK' | 'DEGRADED' | 'DOWN';
        uptimeSeconds: number;
        version: string;
        environment: string;
    };
    database: {
        status: 'OK' | 'DOWN';
        latencyMs: number;
        provider: string;
    };
    connector: {
        status: ConnectorStatus;
        lastSeenAt?: string | null;
        activeConnectorsCount: number;
    };
    vpn: {
        status: 'CONNECTED' | 'DISCONNECTED' | 'N/A';
        remoteIp: string;
        interface: string;
    };
    mikrotik: {
        host: string;
        port: number;
        isReachable: boolean;
        apiStatus: 'CONNECTED' | 'AUTHENTICATION_FAILED' | 'UNREACHABLE' | 'MOCK';
        identity: string;
        version: string;
        model: string;
        mode: ConnectionMode;
    };
}
export interface DashboardSummary {
    users: {
        total: number;
        active: number;
        online: number;
        expired: number;
        disabled: number;
    };
    vouchers: {
        total: number;
        unused: number;
        activated: number;
        expired: number;
    };
    sales: {
        todayBDT: number;
        monthBDT: number;
        totalBDT: number;
        currency: string;
    };
    system: {
        router: {
            connected: boolean;
            identity: string;
            cpuLoad: number;
            memoryUsagePercent: number;
        };
        vpn: {
            connected: boolean;
            ip: string;
        };
        connector: {
            online: boolean;
            activeCount: number;
        };
    };
    trafficHistory: Array<{
        timestamp: string;
        downloadMbps: number;
        uploadMbps: number;
    }>;
    packageDistribution: Array<{
        packageName: string;
        userCount: number;
    }>;
}
export interface SystemSettings {
    businessName: string;
    businessTagline?: string;
    businessLogoUrl?: string | null;
    supportPhone: string;
    developerCredit?: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    voucherPrefix: string;
    voucherLength: number;
    defaultPackageId?: string | null;
    defaultValidityMode: ValidityMode;
    termsAndConditionsBangla: string;
    termsAndConditionsEnglish: string;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
}
//# sourceMappingURL=index.d.ts.map
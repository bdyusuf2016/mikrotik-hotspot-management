"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsUpdateSchema = exports.ConnectorHeartbeatSchema = exports.ConnectorRegisterSchema = exports.VoucherBatchQuerySchema = exports.VoucherGenerateSchema = exports.HotspotPackageSchema = exports.HotspotUserUpdateSchema = exports.HotspotUserCreateSchema = exports.RefreshTokenSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    password: zod_1.z.string().min(4, 'Password must be at least 4 characters')
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10, 'Refresh token required')
});
exports.HotspotUserCreateSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'),
    password: zod_1.z.string().min(3, 'Password must be at least 3 characters'),
    fullName: zod_1.z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
    phone: zod_1.z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
    packageId: zod_1.z.string().min(1, 'Package selection is required'),
    macAddress: zod_1.z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
    ipAddress: zod_1.z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
    notes: zod_1.z.string().max(500).optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined))
});
exports.HotspotUserUpdateSchema = exports.HotspotUserCreateSchema.partial().extend({
    status: zod_1.z.enum(['ACTIVE', 'EXPIRED', 'DISABLED', 'BLOCKED', 'UNUSED']).optional()
});
exports.HotspotPackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Package name required'),
    price: zod_1.z.number().nonnegative('Price must be positive or 0'),
    durationMinutes: zod_1.z.number().int().positive('Duration must be greater than 0 minutes'),
    downloadMbps: zod_1.z.number().positive('Download speed must be greater than 0'),
    uploadMbps: zod_1.z.number().positive('Upload speed must be greater than 0'),
    dataLimitMB: zod_1.z.number().int().nonnegative().optional().nullable(),
    sharedUsers: zod_1.z.number().int().min(1).default(1),
    sessionTimeout: zod_1.z.number().int().positive().optional().nullable(),
    idleTimeout: zod_1.z.number().int().positive().optional().nullable(),
    validityMode: zod_1.z.enum(['FROM_FIRST_LOGIN', 'FROM_CREATION', 'ACCUMULATIVE']).default('FROM_FIRST_LOGIN'),
    status: zod_1.z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});
exports.VoucherGenerateSchema = zod_1.z.object({
    packageId: zod_1.z.string().min(1, 'Package ID is required'),
    quantity: zod_1.z.number().int().min(1).max(500).default(1),
    prefix: zod_1.z.string().max(6).optional().default('HS-'),
    codeLength: zod_1.z.number().int().min(4).max(12).default(6),
    includePassword: zod_1.z.boolean().default(true)
});
exports.VoucherBatchQuerySchema = zod_1.z.object({
    packageId: zod_1.z.string().optional(),
    status: zod_1.z.enum(['UNUSED', 'ACTIVATED', 'EXPIRED', 'DISABLED']).optional(),
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20)
});
exports.ConnectorRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, 'Connector name is required'),
    systemInfo: zod_1.z.record(zod_1.z.any()).optional()
});
exports.ConnectorHeartbeatSchema = zod_1.z.object({
    connectorId: zod_1.z.string().min(1, 'Connector ID required'),
    version: zod_1.z.string().default('1.0.0'),
    timestamp: zod_1.z.string().default(() => new Date().toISOString()),
    status: zod_1.z.enum(['ONLINE', 'OFFLINE', 'BUSY']).default('ONLINE'),
    systemStats: zod_1.z.object({
        cpuUsagePercent: zod_1.z.number().optional(),
        memoryUsagePercent: zod_1.z.number().optional(),
        canReachMikrotik: zod_1.z.boolean()
    }).optional()
});
exports.SystemSettingsUpdateSchema = zod_1.z.object({
    businessName: zod_1.z.string().min(2),
    businessTagline: zod_1.z.string().optional(),
    businessLogoUrl: zod_1.z.string().url().optional().nullable(),
    supportPhone: zod_1.z.string().min(5),
    developerCredit: zod_1.z.string().optional(),
    currency: zod_1.z.string().default('BDT'),
    currencySymbol: zod_1.z.string().default('৳'),
    timezone: zod_1.z.string().default('Asia/Dhaka'),
    voucherPrefix: zod_1.z.string().max(6).default('HS-'),
    voucherLength: zod_1.z.number().int().min(4).max(12).default(6),
    defaultPackageId: zod_1.z.string().optional().nullable(),
    defaultValidityMode: zod_1.z.enum(['FROM_FIRST_LOGIN', 'FROM_CREATION', 'ACCUMULATIVE']).default('FROM_FIRST_LOGIN'),
    termsAndConditionsBangla: zod_1.z.string().optional(),
    termsAndConditionsEnglish: zod_1.z.string().optional()
});
//# sourceMappingURL=index.js.map
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(4, 'Password must be at least 4 characters')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10, 'Refresh token required')
});

export const HotspotUserCreateSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens and underscores'),
  password: z.string().min(3, 'Password must be at least 3 characters'),
  fullName: z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
  phone: z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
  packageId: z.string().min(1, 'Package selection is required'),
  macAddress: z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
  ipAddress: z.string().optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined)),
  notes: z.string().max(500).optional().nullable().transform(v => (v && v.trim() !== '' ? v.trim() : undefined))
});

export const HotspotUserUpdateSchema = HotspotUserCreateSchema.partial().extend({
  status: z.enum(['ACTIVE', 'EXPIRED', 'DISABLED', 'BLOCKED', 'UNUSED']).optional()
});

export const HotspotPackageSchema = z.object({
  name: z.string().min(2, 'Package name required'),
  price: z.number().nonnegative('Price must be positive or 0'),
  durationMinutes: z.number().int().positive('Duration must be greater than 0 minutes'),
  downloadMbps: z.number().positive('Download speed must be greater than 0'),
  uploadMbps: z.number().positive('Upload speed must be greater than 0'),
  dataLimitMB: z.number().int().nonnegative().optional().nullable(),
  sharedUsers: z.number().int().min(1).default(1),
  sessionTimeout: z.number().int().positive().optional().nullable(),
  idleTimeout: z.number().int().positive().optional().nullable(),
  validityMode: z.enum(['FROM_FIRST_LOGIN', 'FROM_CREATION', 'ACCUMULATIVE']).default('FROM_FIRST_LOGIN'),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE')
});

export const VoucherGenerateSchema = z.object({
  packageId: z.string().min(1, 'Package ID is required'),
  quantity: z.number().int().min(1).max(500).default(1),
  prefix: z.string().max(6).optional().default('HS-'),
  codeLength: z.number().int().min(4).max(12).default(6),
  includePassword: z.boolean().default(true)
});

export const VoucherBatchQuerySchema = z.object({
  packageId: z.string().optional(),
  status: z.enum(['UNUSED', 'ACTIVATED', 'EXPIRED', 'DISABLED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const ConnectorRegisterSchema = z.object({
  name: z.string().min(3, 'Connector name is required'),
  systemInfo: z.record(z.any()).optional()
});

export const ConnectorHeartbeatSchema = z.object({
  connectorId: z.string().uuid(),
  version: z.string(),
  timestamp: z.string().datetime(),
  status: z.enum(['ONLINE', 'OFFLINE', 'BUSY']).default('ONLINE'),
  systemStats: z.object({
    cpuUsagePercent: z.number().optional(),
    memoryUsagePercent: z.number().optional(),
    canReachMikrotik: z.boolean()
  }).optional()
});

export const SystemSettingsUpdateSchema = z.object({
  businessName: z.string().min(2),
  businessTagline: z.string().optional(),
  businessLogoUrl: z.string().url().optional().nullable(),
  supportPhone: z.string().min(5),
  developerCredit: z.string().optional(),
  currency: z.string().default('BDT'),
  currencySymbol: z.string().default('৳'),
  timezone: z.string().default('Asia/Dhaka'),
  voucherPrefix: z.string().max(6).default('HS-'),
  voucherLength: z.number().int().min(4).max(12).default(6),
  defaultPackageId: z.string().optional().nullable(),
  defaultValidityMode: z.enum(['FROM_FIRST_LOGIN', 'FROM_CREATION', 'ACCUMULATIVE']).default('FROM_FIRST_LOGIN'),
  termsAndConditionsBangla: z.string().optional(),
  termsAndConditionsEnglish: z.string().optional()
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type HotspotUserCreateInput = z.infer<typeof HotspotUserCreateSchema>;
export type HotspotUserUpdateInput = z.infer<typeof HotspotUserUpdateSchema>;
export type HotspotPackageInput = z.infer<typeof HotspotPackageSchema>;
export type VoucherGenerateInput = z.infer<typeof VoucherGenerateSchema>;
export type ConnectorHeartbeatInput = z.infer<typeof ConnectorHeartbeatSchema>;
export type SystemSettingsUpdateInput = z.infer<typeof SystemSettingsUpdateSchema>;

import { z } from 'zod';
export declare const LoginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const RefreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodString;
}, "strip", z.ZodTypeAny, {
    refreshToken: string;
}, {
    refreshToken: string;
}>;
export declare const HotspotUserCreateSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>;
    phone: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>;
    packageId: z.ZodString;
    macAddress: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>;
    ipAddress: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>;
    notes: z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
    packageId: string;
    fullName?: string | undefined;
    phone?: string | undefined;
    macAddress?: string | undefined;
    ipAddress?: string | undefined;
    notes?: string | undefined;
}, {
    username: string;
    password: string;
    packageId: string;
    fullName?: string | null | undefined;
    phone?: string | null | undefined;
    macAddress?: string | null | undefined;
    ipAddress?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const HotspotUserUpdateSchema: z.ZodObject<{
    username: z.ZodOptional<z.ZodString>;
    password: z.ZodOptional<z.ZodString>;
    fullName: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>>;
    phone: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>>;
    packageId: z.ZodOptional<z.ZodString>;
    macAddress: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>>;
    ipAddress: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>>;
    notes: z.ZodOptional<z.ZodEffects<z.ZodNullable<z.ZodOptional<z.ZodString>>, string | undefined, string | null | undefined>>;
} & {
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "EXPIRED", "DISABLED", "BLOCKED", "UNUSED"]>>;
}, "strip", z.ZodTypeAny, {
    username?: string | undefined;
    password?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | "BLOCKED" | "UNUSED" | undefined;
    fullName?: string | undefined;
    phone?: string | undefined;
    packageId?: string | undefined;
    macAddress?: string | undefined;
    ipAddress?: string | undefined;
    notes?: string | undefined;
}, {
    username?: string | undefined;
    password?: string | undefined;
    status?: "ACTIVE" | "EXPIRED" | "DISABLED" | "BLOCKED" | "UNUSED" | undefined;
    fullName?: string | null | undefined;
    phone?: string | null | undefined;
    packageId?: string | undefined;
    macAddress?: string | null | undefined;
    ipAddress?: string | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const HotspotPackageSchema: z.ZodObject<{
    name: z.ZodString;
    price: z.ZodNumber;
    durationMinutes: z.ZodNumber;
    downloadMbps: z.ZodNumber;
    uploadMbps: z.ZodNumber;
    dataLimitMB: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    sharedUsers: z.ZodDefault<z.ZodNumber>;
    sessionTimeout: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    idleTimeout: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    validityMode: z.ZodDefault<z.ZodEnum<["FROM_FIRST_LOGIN", "FROM_CREATION", "ACCUMULATIVE"]>>;
    status: z.ZodDefault<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "INACTIVE";
    name: string;
    price: number;
    durationMinutes: number;
    downloadMbps: number;
    uploadMbps: number;
    sharedUsers: number;
    validityMode: "FROM_FIRST_LOGIN" | "FROM_CREATION" | "ACCUMULATIVE";
    dataLimitMB?: number | null | undefined;
    sessionTimeout?: number | null | undefined;
    idleTimeout?: number | null | undefined;
}, {
    name: string;
    price: number;
    durationMinutes: number;
    downloadMbps: number;
    uploadMbps: number;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    dataLimitMB?: number | null | undefined;
    sharedUsers?: number | undefined;
    sessionTimeout?: number | null | undefined;
    idleTimeout?: number | null | undefined;
    validityMode?: "FROM_FIRST_LOGIN" | "FROM_CREATION" | "ACCUMULATIVE" | undefined;
}>;
export declare const VoucherGenerateSchema: z.ZodObject<{
    packageId: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
    prefix: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    codeLength: z.ZodDefault<z.ZodNumber>;
    includePassword: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    packageId: string;
    quantity: number;
    prefix: string;
    codeLength: number;
    includePassword: boolean;
}, {
    packageId: string;
    quantity?: number | undefined;
    prefix?: string | undefined;
    codeLength?: number | undefined;
    includePassword?: boolean | undefined;
}>;
export declare const VoucherBatchQuerySchema: z.ZodObject<{
    packageId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["UNUSED", "ACTIVATED", "EXPIRED", "DISABLED"]>>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    status?: "EXPIRED" | "DISABLED" | "UNUSED" | "ACTIVATED" | undefined;
    packageId?: string | undefined;
}, {
    status?: "EXPIRED" | "DISABLED" | "UNUSED" | "ACTIVATED" | undefined;
    packageId?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
export declare const ConnectorRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    systemInfo: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    systemInfo?: Record<string, any> | undefined;
}, {
    name: string;
    systemInfo?: Record<string, any> | undefined;
}>;
export declare const ConnectorHeartbeatSchema: z.ZodObject<{
    connectorId: z.ZodString;
    version: z.ZodDefault<z.ZodString>;
    timestamp: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["ONLINE", "OFFLINE", "BUSY"]>>;
    systemStats: z.ZodOptional<z.ZodObject<{
        cpuUsagePercent: z.ZodOptional<z.ZodNumber>;
        memoryUsagePercent: z.ZodOptional<z.ZodNumber>;
        canReachMikrotik: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        canReachMikrotik: boolean;
        cpuUsagePercent?: number | undefined;
        memoryUsagePercent?: number | undefined;
    }, {
        canReachMikrotik: boolean;
        cpuUsagePercent?: number | undefined;
        memoryUsagePercent?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    status: "ONLINE" | "OFFLINE" | "BUSY";
    connectorId: string;
    version: string;
    timestamp: string;
    systemStats?: {
        canReachMikrotik: boolean;
        cpuUsagePercent?: number | undefined;
        memoryUsagePercent?: number | undefined;
    } | undefined;
}, {
    connectorId: string;
    status?: "ONLINE" | "OFFLINE" | "BUSY" | undefined;
    version?: string | undefined;
    timestamp?: string | undefined;
    systemStats?: {
        canReachMikrotik: boolean;
        cpuUsagePercent?: number | undefined;
        memoryUsagePercent?: number | undefined;
    } | undefined;
}>;
export declare const SystemSettingsUpdateSchema: z.ZodObject<{
    businessName: z.ZodString;
    businessTagline: z.ZodOptional<z.ZodString>;
    businessLogoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    supportPhone: z.ZodString;
    developerCredit: z.ZodOptional<z.ZodString>;
    currency: z.ZodDefault<z.ZodString>;
    currencySymbol: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
    voucherPrefix: z.ZodDefault<z.ZodString>;
    voucherLength: z.ZodDefault<z.ZodNumber>;
    defaultPackageId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    defaultValidityMode: z.ZodDefault<z.ZodEnum<["FROM_FIRST_LOGIN", "FROM_CREATION", "ACCUMULATIVE"]>>;
    termsAndConditionsBangla: z.ZodOptional<z.ZodString>;
    termsAndConditionsEnglish: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessName: string;
    supportPhone: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    voucherPrefix: string;
    voucherLength: number;
    defaultValidityMode: "FROM_FIRST_LOGIN" | "FROM_CREATION" | "ACCUMULATIVE";
    businessTagline?: string | undefined;
    businessLogoUrl?: string | null | undefined;
    developerCredit?: string | undefined;
    defaultPackageId?: string | null | undefined;
    termsAndConditionsBangla?: string | undefined;
    termsAndConditionsEnglish?: string | undefined;
}, {
    businessName: string;
    supportPhone: string;
    businessTagline?: string | undefined;
    businessLogoUrl?: string | null | undefined;
    developerCredit?: string | undefined;
    currency?: string | undefined;
    currencySymbol?: string | undefined;
    timezone?: string | undefined;
    voucherPrefix?: string | undefined;
    voucherLength?: number | undefined;
    defaultPackageId?: string | null | undefined;
    defaultValidityMode?: "FROM_FIRST_LOGIN" | "FROM_CREATION" | "ACCUMULATIVE" | undefined;
    termsAndConditionsBangla?: string | undefined;
    termsAndConditionsEnglish?: string | undefined;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type HotspotUserCreateInput = z.infer<typeof HotspotUserCreateSchema>;
export type HotspotUserUpdateInput = z.infer<typeof HotspotUserUpdateSchema>;
export type HotspotPackageInput = z.infer<typeof HotspotPackageSchema>;
export type VoucherGenerateInput = z.infer<typeof VoucherGenerateSchema>;
export type ConnectorHeartbeatInput = z.infer<typeof ConnectorHeartbeatSchema>;
export type SystemSettingsUpdateInput = z.infer<typeof SystemSettingsUpdateSchema>;
//# sourceMappingURL=index.d.ts.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BANGLA_SYSTEM_MESSAGES = exports.ERROR_CODES = exports.PRESET_PACKAGES = exports.STANDARD_PROFILES = exports.USER_ROLES = exports.DEFAULT_TIMEZONE = exports.DEFAULT_CURRENCY_SYMBOL = exports.DEFAULT_CURRENCY = void 0;
exports.DEFAULT_CURRENCY = 'BDT';
exports.DEFAULT_CURRENCY_SYMBOL = '৳';
exports.DEFAULT_TIMEZONE = 'Asia/Dhaka';
exports.USER_ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    OPERATOR: 'OPERATOR'
};
exports.STANDARD_PROFILES = [
    { name: 'HS-1M', rateLimit: '1M/1M', downloadMbps: 1, uploadMbps: 1 },
    { name: 'HS-2M', rateLimit: '2M/2M', downloadMbps: 2, uploadMbps: 2 },
    { name: 'HS-5M', rateLimit: '5M/2M', downloadMbps: 5, uploadMbps: 2 },
    { name: 'HS-10M', rateLimit: '10M/5M', downloadMbps: 10, uploadMbps: 5 }
];
exports.PRESET_PACKAGES = [
    { name: '1 Hour', durationMinutes: 60, price: 10, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '3 Hours', durationMinutes: 180, price: 20, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '6 Hours', durationMinutes: 360, price: 30, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '12 Hours', durationMinutes: 720, price: 45, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '1 Day', durationMinutes: 1440, price: 50, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '3 Days', durationMinutes: 4320, price: 120, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '7 Days', durationMinutes: 10080, price: 250, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '15 Days', durationMinutes: 21600, price: 450, downloadMbps: 5, uploadMbps: 2, validityMode: 'FROM_FIRST_LOGIN' },
    { name: '30 Days', durationMinutes: 43200, price: 800, downloadMbps: 10, uploadMbps: 5, validityMode: 'FROM_FIRST_LOGIN' }
];
exports.ERROR_CODES = {
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    MIKROTIK_UNREACHABLE: 'MIKROTIK_UNREACHABLE',
    MIKROTIK_AUTH_FAILED: 'MIKROTIK_AUTH_FAILED',
    CONNECTOR_OFFLINE: 'CONNECTOR_OFFLINE',
    DUPLICATE_USERNAME: 'DUPLICATE_USERNAME',
    INTERNAL_ERROR: 'INTERNAL_ERROR'
};
exports.BANGLA_SYSTEM_MESSAGES = {
    INVALID_CREDENTIALS: 'ভুল ইউজারনেম অথবা পাসওয়ার্ড।',
    PACKAGE_EXPIRED: 'আপনার প্যাকেজের মেয়াদ শেষ হয়েছে।',
    ACCOUNT_DISABLED: 'আপনার অ্যাকাউন্টটি বন্ধ করা হয়েছে।',
    SESSION_DISCONNECTED: 'ইউজার সেশন সফলভাবে বিচ্ছিন্ন করা হয়েছে।',
    VOUCHER_GENERATED: 'ভাউচার সফলভাবে তৈরি হয়েছে।',
    SETTINGS_SAVED: 'সেটিংস সফলভাবে সংরক্ষিত হয়েছে।'
};
//# sourceMappingURL=index.js.map
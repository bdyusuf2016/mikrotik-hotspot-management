export declare const DEFAULT_CURRENCY = "BDT";
export declare const DEFAULT_CURRENCY_SYMBOL = "\u09F3";
export declare const DEFAULT_TIMEZONE = "Asia/Dhaka";
export declare const USER_ROLES: {
    readonly SUPER_ADMIN: "SUPER_ADMIN";
    readonly ADMIN: "ADMIN";
    readonly OPERATOR: "OPERATOR";
};
export declare const STANDARD_PROFILES: readonly [{
    readonly name: "HS-1M";
    readonly rateLimit: "1M/1M";
    readonly downloadMbps: 1;
    readonly uploadMbps: 1;
}, {
    readonly name: "HS-2M";
    readonly rateLimit: "2M/2M";
    readonly downloadMbps: 2;
    readonly uploadMbps: 2;
}, {
    readonly name: "HS-5M";
    readonly rateLimit: "5M/2M";
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
}, {
    readonly name: "HS-10M";
    readonly rateLimit: "10M/5M";
    readonly downloadMbps: 10;
    readonly uploadMbps: 5;
}];
export declare const PRESET_PACKAGES: readonly [{
    readonly name: "1 Hour";
    readonly durationMinutes: 60;
    readonly price: 10;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "3 Hours";
    readonly durationMinutes: 180;
    readonly price: 20;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "6 Hours";
    readonly durationMinutes: 360;
    readonly price: 30;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "12 Hours";
    readonly durationMinutes: 720;
    readonly price: 45;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "1 Day";
    readonly durationMinutes: 1440;
    readonly price: 50;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "3 Days";
    readonly durationMinutes: 4320;
    readonly price: 120;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "7 Days";
    readonly durationMinutes: 10080;
    readonly price: 250;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "15 Days";
    readonly durationMinutes: 21600;
    readonly price: 450;
    readonly downloadMbps: 5;
    readonly uploadMbps: 2;
    readonly validityMode: "FROM_FIRST_LOGIN";
}, {
    readonly name: "30 Days";
    readonly durationMinutes: 43200;
    readonly price: 800;
    readonly downloadMbps: 10;
    readonly uploadMbps: 5;
    readonly validityMode: "FROM_FIRST_LOGIN";
}];
export declare const ERROR_CODES: {
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly MIKROTIK_UNREACHABLE: "MIKROTIK_UNREACHABLE";
    readonly MIKROTIK_AUTH_FAILED: "MIKROTIK_AUTH_FAILED";
    readonly CONNECTOR_OFFLINE: "CONNECTOR_OFFLINE";
    readonly DUPLICATE_USERNAME: "DUPLICATE_USERNAME";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
export declare const BANGLA_SYSTEM_MESSAGES: {
    readonly INVALID_CREDENTIALS: "ভুল ইউজারনেম অথবা পাসওয়ার্ড।";
    readonly PACKAGE_EXPIRED: "আপনার প্যাকেজের মেয়াদ শেষ হয়েছে।";
    readonly ACCOUNT_DISABLED: "আপনার অ্যাকাউন্টটি বন্ধ করা হয়েছে।";
    readonly SESSION_DISCONNECTED: "ইউজার সেশন সফলভাবে বিচ্ছিন্ন করা হয়েছে।";
    readonly VOUCHER_GENERATED: "ভাউচার সফলভাবে তৈরি হয়েছে।";
    readonly SETTINGS_SAVED: "সেটিংস সফলভাবে সংরক্ষিত হয়েছে।";
};
//# sourceMappingURL=index.d.ts.map
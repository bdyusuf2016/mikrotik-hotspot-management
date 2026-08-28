export type Locale = 'bn' | 'en';

export const translations = {
  bn: {
    app_title: 'স্মার্ট হটস্পট ম্যানেজার',
    app_subtitle: 'MikroTik RouterOS 7 ম্যানেজমেন্ট প্ল্যাটফর্ম',
    mock_banner: 'সিমুলেশন / মক মোড সক্রিয় রয়েছে। আপনার আসল রাউটার (10.10.13.38) নিরাপদ ও অপরিবর্তিত রয়েছে।',
    nav_dashboard: 'ড্যাশবোর্ড',
    nav_diagnostics: 'নেটওয়ার্ক ডায়াগনস্টিকস',
    nav_users: 'হটস্পট ইউজার',
    nav_packages: 'প্যাকেজ ও ব্যান্ডউইথ',
    nav_vouchers: 'ভাউচার ও প্রিন্ট',
    nav_active_sessions: 'লাইভ অ্যাক্টিভ সেশন',
    nav_connectors: 'ভিপিএন কানেক্টর',
    nav_settings: 'সিস্টেম সেটিংস',
    nav_logout: 'লগআউট',
    
    // KPI Cards
    card_total_users: 'মোট গ্রাহক',
    card_active_users: 'সক্রিয় গ্রাহক',
    card_online_users: 'অনলাইন সেশন',
    card_expired_users: 'মেয়াদোত্তীর্ণ ইউজার',
    card_total_vouchers: 'মোট ভাউচার',
    card_unused_vouchers: 'অব্যবহৃত ভাউচার',
    card_today_sales: 'আজকের বিক্রি',
    card_month_sales: 'চলতি মাসের বিক্রি',
    
    // Status badges
    status_mikrotik: 'মিক্রোটিক রাউটার',
    status_vpn: 'ক্লাউড ভিপিএন (SSTP)',
    status_connector: 'কানেক্টর এজেন্ট',
    status_connected: 'সংযুক্ত',
    status_disconnected: 'বিচ্ছিন্ন',
    status_online: 'অনলাইন',
    status_offline: 'অফলাইন',
    status_active: 'সক্রিয়',
    status_unused: 'ব্যবহারযোগ্য',
    status_expired: 'মেয়াদ শেষ',
    status_disabled: 'বন্ধ',
    status_blocked: 'ব্লকড',

    // Actions & Buttons
    btn_add_user: 'নতুন ইউজার তৈরি',
    btn_generate_voucher: 'ভাউচার জেনারেট',
    btn_print_vouchers: 'প্রিন্ট ভাউচার শিট',
    btn_disconnect: 'বিচ্ছিন্ন করুন',
    btn_refresh: 'রিফ্রেশ',
    btn_save: 'সংরক্ষণ করুন',
    btn_cancel: 'বাতিল',
    btn_delete: 'মুছে ফেলুন',
    btn_quick_admin: 'Super Admin হিসেবে ডেমো লগইন',
    btn_quick_operator: 'Operator হিসেবে ডেমো লগইন',

    // Charts
    chart_traffic_title: 'লাইভ ট্রাফিক ব্যান্ডউইথ (Mbps)',
    chart_package_title: 'প্যাকেজ অনুযায়ী গ্রাহক বণ্টন',
    download: 'ডাউনলোড',
    upload: 'আপলোড',

    // Table Headers
    th_username: 'ইউজারনেম',
    th_fullname: 'পুরো নাম / ফোন',
    th_package: 'প্যাকেজ',
    th_profile: 'প্রোফাইল',
    th_ip_mac: 'আইপি / ম্যাক এড্রেস',
    th_expires: 'মেয়াদ শেষ',
    th_status: 'অবস্থা',
    th_actions: 'অ্যাকশন',
    th_code: 'ভাউচার কোড',
    th_password: 'পাসওয়ার্ড',
    th_price: 'মূল্য',
    th_duration: 'মেয়াদ',
    th_uptime: 'আপটাইম',
    th_traffic: 'মোট ট্রাফিক'
  },
  en: {
    app_title: 'Smart HotSpot Manager',
    app_subtitle: 'MikroTik RouterOS 7 Management Platform',
    mock_banner: 'RouterOS Simulation / Mock Mode is Active. Your live router (10.10.13.38) is completely untouched & safe.',
    nav_dashboard: 'Dashboard',
    nav_diagnostics: 'Network Diagnostics',
    nav_users: 'Hotspot Users',
    nav_packages: 'Packages & Bandwidth',
    nav_vouchers: 'Vouchers & Print',
    nav_active_sessions: 'Live Active Sessions',
    nav_connectors: 'VPN Connectors',
    nav_settings: 'System Settings',
    nav_logout: 'Logout',
    
    // KPI Cards
    card_total_users: 'Total Subscribers',
    card_active_users: 'Active Users',
    card_online_users: 'Online Sessions',
    card_expired_users: 'Expired Users',
    card_total_vouchers: 'Total Vouchers',
    card_unused_vouchers: 'Unused Vouchers',
    card_today_sales: "Today's Sales",
    card_month_sales: 'Monthly Sales',

    // Status badges
    status_mikrotik: 'MikroTik Router',
    status_vpn: 'Cloud VPN (SSTP)',
    status_connector: 'Connector Agent',
    status_connected: 'Connected',
    status_disconnected: 'Disconnected',
    status_online: 'Online',
    status_offline: 'Offline',
    status_active: 'Active',
    status_unused: 'Unused',
    status_expired: 'Expired',
    status_disabled: 'Disabled',
    status_blocked: 'Blocked',

    // Actions & Buttons
    btn_add_user: 'Create Hotspot User',
    btn_generate_voucher: 'Generate Vouchers',
    btn_print_vouchers: 'Print Voucher Sheet',
    btn_disconnect: 'Disconnect',
    btn_refresh: 'Refresh',
    btn_save: 'Save Changes',
    btn_cancel: 'Cancel',
    btn_delete: 'Delete',
    btn_quick_admin: 'Demo Login as Super Admin',
    btn_quick_operator: 'Demo Login as Operator',

    // Charts
    chart_traffic_title: 'Live Traffic Bandwidth (Mbps)',
    chart_package_title: 'Subscribers by Package',
    download: 'Download',
    upload: 'Upload',

    // Table Headers
    th_username: 'Username',
    th_fullname: 'Full Name / Phone',
    th_package: 'Package',
    th_profile: 'Profile',
    th_ip_mac: 'IP / MAC Address',
    th_expires: 'Expires At',
    th_status: 'Status',
    th_actions: 'Actions',
    th_code: 'Voucher Code',
    th_password: 'Password',
    th_price: 'Price',
    th_duration: 'Duration',
    th_uptime: 'Uptime',
    th_traffic: 'Total Traffic'
  }
};

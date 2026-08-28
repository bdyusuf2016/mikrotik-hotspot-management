import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { SystemSettings } from '@hotspot/shared';
import {
  Settings,
  Save,
  CheckCircle,
  Building,
  Phone,
  Ticket,
  FileText,
  Shield,
  Clock,
  Sparkles,
  Wifi,
  Code,
  Server,
  Key,
  Globe,
  Radio
} from 'lucide-react';

interface ServerProfileData {
  id?: string;
  name: string;
  hotspotAddress?: string;
  dnsName?: string;
  htmlDirectory?: string;
  loginBy: string[];
  httpCookieLifetime?: string;
  useRadius?: boolean;
}

export const SettingsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  // Branding & System Settings state
  const [businessName, setBusinessName] = useState('');
  const [businessTagline, setBusinessTagline] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [developerCredit, setDeveloperCredit] = useState('');
  const [currency, setCurrency] = useState('BDT');
  const [timezone, setTimezone] = useState('Asia/Dhaka');
  const [voucherPrefix, setVoucherPrefix] = useState('HS-');
  const [voucherLength, setVoucherLength] = useState(6);
  const [termsBangla, setTermsBangla] = useState('');
  const [termsEnglish, setTermsEnglish] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncingPortal, setSyncingPortal] = useState(false);

  // Router Server Profile Login Config State
  const [serverProfileName, setServerProfileName] = useState('hsprof1');
  const [hotspotAddress, setHotspotAddress] = useState('10.20.20.1');
  const [dnsName, setDnsName] = useState('login.hotspot');
  const [htmlDirectory, setHtmlDirectory] = useState('flash/hotspot');
  const [cookieLifetime, setCookieLifetime] = useState('3d');
  const [loginMethods, setLoginMethods] = useState<string[]>(['http-pap', 'mac-cookie', 'http-chap', 'cookie']);

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: () => apiRequest<SystemSettings>('/settings')
  });

  const { data: serverProfile, isLoading: isProfileLoading } = useQuery<ServerProfileData>({
    queryKey: ['router-server-profile'],
    queryFn: () => apiRequest<ServerProfileData>('/mikrotik/server-profile')
  });

  useEffect(() => {
    if (settings) {
      setBusinessName(settings.businessName || 'Yusuf Computer & IT');
      setBusinessTagline(settings.businessTagline || 'স্মার্ট হাই-স্পিড ওয়াইফাই হটস্পট');
      setSupportPhone(settings.supportPhone || '01933814200');
      setDeveloperCredit(settings.developerCredit || 'Designed & Developed by Yusuf IT');
      setCurrency(settings.currency || 'BDT');
      setTimezone(settings.timezone || 'Asia/Dhaka');
      setVoucherPrefix(settings.voucherPrefix || 'HS-');
      setVoucherLength(settings.voucherLength || 6);
      setTermsBangla(settings.termsAndConditionsBangla || '');
      setTermsEnglish(settings.termsAndConditionsEnglish || '');
    }
  }, [settings]);

  useEffect(() => {
    if (serverProfile) {
      setServerProfileName(serverProfile.name || 'hsprof1');
      setHotspotAddress(serverProfile.hotspotAddress || '10.20.20.1');
      setDnsName(serverProfile.dnsName || 'login.hotspot');
      setHtmlDirectory(serverProfile.htmlDirectory || 'flash/hotspot');
      setCookieLifetime(serverProfile.httpCookieLifetime || '3d');
      if (serverProfile.loginBy && Array.isArray(serverProfile.loginBy)) {
        setLoginMethods(serverProfile.loginBy);
      }
    }
  }, [serverProfile]);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: Partial<SystemSettings>) =>
      apiRequest<SystemSettings>('/settings', { method: 'PUT', body: JSON.stringify(newSettings) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setSuccessMsg('সেটিংস সংরক্ষিত হয়েছে এবং MikroTik হটস্পট পোর্টালে অটো-সিঙ্ক সম্পন্ন হয়েছে! 🚀');
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  });

  const updateServerProfileMutation = useMutation({
    mutationFn: (profileData: Partial<ServerProfileData>) =>
      apiRequest<{ success: boolean; message: string }>('/mikrotik/server-profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['router-server-profile'] });
      setSuccessMsg('MikroTik Router-এর Server Login Configuration সফলভাবে আপডেট করা হয়েছে! 🚀');
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  });

  const handleSyncPortalOnly = async () => {
    setSyncingPortal(true);
    try {
      await apiRequest('/settings/sync-portal', { method: 'POST' });
      setSuccessMsg('হটস্পট লগইন ও স্ট্যাটাস পেজ রাউটারে সফলভাবে সিঙ্ক হয়েছে! 🚀');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch {
      setSuccessMsg('রাউটারের সাথে সিঙ্ক করতে সমস্যা হয়েছে। দয়া করে কানেকশন চেক করুন।');
    } finally {
      setSyncingPortal(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      businessName,
      businessTagline,
      supportPhone,
      developerCredit,
      currency,
      timezone,
      voucherPrefix,
      voucherLength: Number(voucherLength),
      termsAndConditionsBangla: termsBangla,
      termsAndConditionsEnglish: termsEnglish
    });
  };

  const handleToggleLoginMethod = (method: string) => {
    setLoginMethods(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

  const handleSaveServerProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateServerProfileMutation.mutate({
      name: serverProfileName,
      hotspotAddress,
      dnsName,
      htmlDirectory,
      httpCookieLifetime: cookieLifetime,
      loginBy: loginMethods
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" />
            {t.nav_settings}
          </h1>
          <p className="text-xs text-slate-400">হটস্পট ব্র্যান্ডিং, সার্ভার লগইন মেথড, ডিএনএস ও ক্যাপটিভ পোর্টাল কনফিগারেশন</p>
        </div>
        <button
          type="button"
          onClick={handleSyncPortalOnly}
          disabled={syncingPortal}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50 shadow-lg"
        >
          <Wifi className="w-4 h-4" />
          <span>{syncingPortal ? 'সিঙ্ক হচ্ছে...' : 'হটস্পট পেজ রাউটারে পুশ করুন 🚀'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* SECTION A: MikroTik Server Login Configuration */}
      <form onSubmit={handleSaveServerProfile} className="space-y-5 text-xs">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/80 to-sky-950/30 border border-sky-500/20 backdrop-blur-md space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-sm font-bold text-sky-300 flex items-center gap-2">
              <Server className="w-4 h-4 text-sky-400" />
              MikroTik Router Server Login Configuration (সরাসরি রাউটার কনফিগারেশন)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
              Profile: {serverProfileName}
            </span>
          </div>

          {/* Login Methods Checkboxes */}
          <div>
            <label className="block font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand-400" />
              লগইন মেথডস (Login By Methods) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'http-pap', label: 'HTTP PAP (সহজ ভাউচার)', desc: '১-ক্লিক কিউআর ও ফর্ম লগইন' },
                { id: 'mac-cookie', label: 'MAC Cookie (ডিভাইস মনে রাখা)', desc: 'স্বয়ংক্রিয় অটো-লগইন' },
                { id: 'http-chap', label: 'HTTP CHAP', desc: 'এনক্রিপ্টেড চ্যালেঞ্জ রেসপন্স' },
                { id: 'cookie', label: 'HTTP Cookie', desc: 'ব্রাউজার সেশন কুকি' },
                { id: 'https', label: 'HTTPS (SSL Login)', desc: 'এসএসএল পোর্টাল লগইন' },
                { id: 'trial', label: 'Trial Mode', desc: 'ফ্রি ট্রায়াল এক্সেস' }
              ].map(method => (
                <label
                  key={method.id}
                  className={`flex flex-col p-2.5 rounded-xl border cursor-pointer transition ${
                    loginMethods.includes(method.id)
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <input
                      type="checkbox"
                      checked={loginMethods.includes(method.id)}
                      onChange={() => handleToggleLoginMethod(method.id)}
                      className="rounded border-slate-700 text-brand-500 focus:ring-brand-500"
                    />
                    <span>{method.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 pl-5">{method.desc}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                হটস্পট ডিএনএস নাম (DNS Name)
              </label>
              <input
                type="text"
                value={dnsName}
                onChange={(e) => setDnsName(e.target.value)}
                placeholder="যেমন: login.hotspot"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                হটস্পট গেটওয়ে আইপি (HotSpot IP)
              </label>
              <input
                type="text"
                value={hotspotAddress}
                onChange={(e) => setHotspotAddress(e.target.value)}
                placeholder="যেমন: 10.20.20.1"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                কুকির মেয়াদ (Cookie Lifetime)
              </label>
              <input
                type="text"
                value={cookieLifetime}
                onChange={(e) => setCookieLifetime(e.target.value)}
                placeholder="যেমন: 3d, 7d, 30d"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={updateServerProfileMutation.isPending}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              <Server className="w-4 h-4" />
              <span>{updateServerProfileMutation.isPending ? 'রাউটারে কনফিগ পুশ হচ্ছে...' : 'রাউটার সার্ভার কনফিগ সেভ করুন 🚀'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* SECTION B: Branding, General Settings & Terms */}
      <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
        {/* Section 1: Business Branding */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 shadow-lg">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Building className="w-4 h-4 text-brand-400" />
            হটস্পট ব্র্যান্ডিং ও পোর্টাল তথ্য (Branding & Identity)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">ব্যবসার নাম (Business Name) *</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="যেমন: Yusuf Computer & IT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-semibold"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">ট্যাগলাইন / সাবটাইটেল</label>
              <input
                type="text"
                value={businessTagline}
                onChange={(e) => setBusinessTagline(e.target.value)}
                placeholder="যেমন: স্মার্ট হাই-স্পিড ওয়াইফাই হটস্পট"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">কাস্টমার হেল্পলাইন ফোন *</label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="যেমন: 01933814200"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-brand-400" />
                ফুটার ক্রেডিট / ডেভেলপার ইনফো (Footer Credit)
              </label>
              <input
                type="text"
                value={developerCredit}
                onChange={(e) => setDeveloperCredit(e.target.value)}
                placeholder="যেমন: Designed & Developed by Yusuf IT"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-brand-300 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Voucher Generator Defaults */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 shadow-lg">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <Ticket className="w-4 h-4 text-sky-400" />
            ভাউচার কোড সেটিংস (Voucher Defaults)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">ডিফল্ট প্রিফিক্স (Prefix)</label>
              <input
                type="text"
                value={voucherPrefix}
                onChange={(e) => setVoucherPrefix(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">ডিফল্ট কোড দৈর্ঘ্য (Digits)</label>
              <input
                type="number"
                min={4}
                max={12}
                value={voucherLength}
                onChange={(e) => setVoucherLength(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Captive Portal Terms */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 shadow-lg">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            ক্যাপটিভ পোর্টাল ব্যবহারের নিয়মাবলী (Terms & Conditions)
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">শর্তাবলী (বাংলা)</label>
              <textarea
                rows={3}
                value={termsBangla}
                onChange={(e) => setTermsBangla(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 leading-relaxed"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Terms & Conditions (English)</label>
              <textarea
                rows={3}
                value={termsEnglish}
                onChange={(e) => setTermsEnglish(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-brand-500 leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{updateSettingsMutation.isPending ? 'সংরক্ষণ ও রাউটারে সিঙ্ক হচ্ছে...' : 'ব্র্যান্ডিং সেটিংস সংরক্ষণ করুন 🚀'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

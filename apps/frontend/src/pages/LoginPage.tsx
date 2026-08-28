import React, { useState } from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useLocaleStore } from '../stores/localeStore.js';
import { apiRequest } from '../api/client.js';
import { Radio, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import type { AdminUser } from '@hotspot/shared';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuthStore();
  const { t } = useLocaleStore();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiRequest<{
        user: AdminUser;
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
    } catch (err) {
      setError((err as Error).message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setTimeout(() => {
      handleLogin();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Glow background decoration */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 shadow-xl shadow-brand-500/25 mb-3 text-white">
            <Radio className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white">{t.app_title}</h1>
          <p className="text-xs text-slate-400 mt-1">{t.app_subtitle}</p>
        </div>

        {/* Security / Safe Mode indicator */}
        <div className="mb-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center gap-2 text-xs text-amber-300">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>RB951 RouterOS 7 Mock Environment Ready</span>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.th_username}</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t.th_password}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{loading ? 'লগইন হচ্ছে...' : 'প্রবেশ করুন'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Quick login pills */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-2">
          <div className="text-[11px] text-slate-400 text-center font-medium">ডিমো অ্যাকাউন্ট দিয়ে সরাসরি টেস্ট করুন:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickDemo('admin', 'Admin@1234')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition text-center"
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => handleQuickDemo('operator', 'Operator@1234')}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 transition text-center"
            >
              🛠️ Field Operator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

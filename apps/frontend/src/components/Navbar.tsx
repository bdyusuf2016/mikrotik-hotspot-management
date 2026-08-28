import React from 'react';
import { useAuthStore } from '../stores/authStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { useLocaleStore } from '../stores/localeStore.js';
import { Sun, Moon, Languages, LogOut, Radio, Shield, Globe } from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const { locale, toggleLocale, t } = useLocaleStore();

  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between no-print">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 shadow-lg shadow-brand-500/20 text-white font-bold text-lg">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-100 flex items-center gap-2 font-display">
            {t.app_title}
            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
              v1.0 RouterOS 7
            </span>
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">{t.app_subtitle}</p>
        </div>
      </div>

      {/* Center status badges */}
      <div className="hidden lg:flex items-center gap-2 text-xs">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>MikroTik 10.10.13.38</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Shield className="w-3.5 h-3.5" />
          <span>SSTP VPN Active</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          <Globe className="w-3.5 h-3.5" />
          <span>GitHub-Ready</span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Language switch */}
        <button
          onClick={toggleLocale}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          title="Toggle Language"
        >
          <Languages className="w-3.5 h-3.5 text-brand-400" />
          <span>{locale === 'bn' ? 'বাংলা' : 'English'}</span>
        </button>

        {/* Theme switch */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          title="Toggle Dark/Light Mode"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* User profile & Logout */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden md:block text-right">
              <div className="text-xs font-semibold text-slate-200">{user.fullName || user.username}</div>
              <div className="text-[10px] text-brand-400 font-mono">{user.role}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
              title={t.nav_logout}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

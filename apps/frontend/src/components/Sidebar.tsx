import React from 'react';
import { useLocaleStore } from '../stores/localeStore.js';
import {
  LayoutDashboard,
  Activity,
  Users,
  Layers,
  Ticket,
  Zap,
  Network,
  Settings,
  BarChart3,
  CreditCard,
  History
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'diagnostics'
  | 'users'
  | 'packages'
  | 'vouchers'
  | 'sessions'
  | 'connectors'
  | 'reports'
  | 'payments'
  | 'audit'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { t } = useLocaleStore();

  const navItems = [
    { id: 'dashboard' as NavTab, label: t.nav_dashboard, icon: LayoutDashboard },
    { id: 'diagnostics' as NavTab, label: t.nav_diagnostics, icon: Activity },
    { id: 'users' as NavTab, label: t.nav_users, icon: Users },
    { id: 'packages' as NavTab, label: t.nav_packages, icon: Layers },
    { id: 'vouchers' as NavTab, label: t.nav_vouchers, icon: Ticket },
    { id: 'sessions' as NavTab, label: t.nav_active_sessions, icon: Zap },
    { id: 'reports' as NavTab, label: 'রিপোর্ট ও বিক্রয়', icon: BarChart3 },
    { id: 'payments' as NavTab, label: 'পেমেন্ট ও ক্যাশ', icon: CreditCard },
    { id: 'connectors' as NavTab, label: t.nav_connectors, icon: Network },
    { id: 'audit' as NavTab, label: 'অডিট লগ', icon: History },
    { id: 'settings' as NavTab, label: t.nav_settings, icon: Settings }
  ];

  return (
    <aside className="w-64 shrink-0 bg-slate-900/50 dark:bg-slate-950/50 border-r border-slate-800 p-4 flex flex-col justify-between min-h-[calc(100vh-65px)] no-print">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* RouterOS spec card */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-1.5 mt-4">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span>MikroTik Router</span>
          <span className="text-[10px] text-emerald-400 font-mono">RB951Ui-2HnD</span>
        </div>
        <div className="text-[11px] text-slate-400 font-mono">
          <div>OS: RouterOS 7.24.1</div>
          <div>VPN IP: 10.10.13.38</div>
          <div>HotSpot: 10.20.20.1/24</div>
        </div>
      </div>
    </aside>
  );
};

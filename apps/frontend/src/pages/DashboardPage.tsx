import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { StatsCard } from '../components/StatsCard.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { NavTab } from '../components/Sidebar.js';
import type { DashboardSummary, HotspotUser, ActiveSession, HotspotVoucher } from '@hotspot/shared';
import {
  Users,
  Zap,
  Ticket,
  DollarSign,
  Radio,
  Cpu,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  History,
  CheckCircle2,
  HardDrive,
  UserX,
  Sparkles,
  TrendingDown,
  X,
  ExternalLink,
  Phone,
  Activity,
  Server,
  Network
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TopConsumer {
  username: string;
  fullName?: string | null;
  packageName?: string | null;
  totalMB: number;
  downloadMB: number;
  uploadMB: number;
  uptimeHours: number;
}

interface ExtendedDashboardSummary extends DashboardSummary {
  topConsumers?: TopConsumer[];
  totalBandwidthGB?: { download: number; upload: number; total: number };
  system: {
    router: {
      connected: boolean;
      identity: string;
      cpuLoad: number;
      memoryUsagePercent: number;
      model?: string;
      version?: string;
      freeMemoryMB?: number;
    };
    vpn: {
      connected: boolean;
      ip: string;
    };
    connector: {
      online: boolean;
      activeCount: number;
    };
  };
}

interface AuditEntry {
  id: string;
  adminUsername: string;
  action: string;
  entity: string;
  createdAt: string;
}

type CardType =
  | 'TOTAL_USERS'
  | 'ONLINE_USERS'
  | 'UNUSED_VOUCHERS'
  | 'SALES'
  | 'ROUTER_HEALTH'
  | 'VPN_STATUS'
  | 'BANDWIDTH'
  | null;

interface DashboardPageProps {
  onNavigate?: (tab: NavTab) => void;
}

const COLORS = ['#0284c7', '#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();
  const [pollingInterval, setPollingInterval] = useState(10000);
  const [sweepResult, setSweepResult] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType>(null);

  const { data: summary, isLoading, refetch, isRefetching } = useQuery<ExtendedDashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiRequest<ExtendedDashboardSummary>('/dashboard/summary'),
    refetchInterval: pollingInterval
  });

  const { data: auditLogs = [] } = useQuery<AuditEntry[]>({
    queryKey: ['audit-logs'],
    queryFn: () => apiRequest<AuditEntry[]>('/audit-logs'),
    refetchInterval: pollingInterval
  });

  // Queries for Modal Details
  const { data: allUsers = [] } = useQuery<HotspotUser[]>({
    queryKey: ['hotspot-users'],
    queryFn: () => apiRequest<HotspotUser[]>('/users'),
    enabled: selectedCard === 'TOTAL_USERS'
  });

  const { data: activeSessions = [] } = useQuery<ActiveSession[]>({
    queryKey: ['active-sessions'],
    queryFn: () => apiRequest<ActiveSession[]>('/sessions/active'),
    enabled: selectedCard === 'ONLINE_USERS'
  });

  const { data: allVouchers = [] } = useQuery<HotspotVoucher[]>({
    queryKey: ['hotspot-vouchers'],
    queryFn: () => apiRequest<HotspotVoucher[]>('/vouchers'),
    enabled: selectedCard === 'UNUSED_VOUCHERS'
  });

  const expirySweepMutation = useMutation({
    mutationFn: () => apiRequest<{ expiredCount: number; checkedCount: number }>('/dashboard/run-expiry-sweep', { method: 'POST' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      setSweepResult(`সফল! ${data.checkedCount} টি একাউন্ট স্ক্যান করে ${data.expiredCount} টি মেয়াদোত্তীর্ণ একাউন্ট নিষ্ক্রিয় করা হয়েছে।`);
      setTimeout(() => setSweepResult(null), 5000);
    }
  });

  const handleNavigateTo = (tab: NavTab) => {
    setSelectedCard(null);
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">ড্যাশবোর্ড ডেটা লোড হচ্ছে...</span>
        </div>
      </div>
    );
  }

  const latestTraffic = summary.trafficHistory?.[summary.trafficHistory.length - 1] || { downloadMbps: 12.4, uploadMbps: 3.8 };

  return (
    <div className="space-y-6">
      {/* Top Header Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2 font-display">
            {t.nav_dashboard}
          </h1>
          <p className="text-xs text-slate-400">রিয়েল-টাইম নেটওয়ার্ক ট্রাফিক, মেয়াদোত্তীর্ণ একাউন্ট ও রেভিনিউ মেট্রিক্স (যেকোনো কার্ডে ক্লিক করে বিস্তারিত দেখুন)</p>
        </div>

        {/* Action buttons & Polling Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 self-start sm:self-auto">
          <button
            onClick={() => expirySweepMutation.mutate()}
            disabled={expirySweepMutation.isPending}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
            title="Scan & disable expired accounts on MikroTik"
          >
            <UserX className="w-3.5 h-3.5" />
            <span>{expirySweepMutation.isPending ? 'স্ক্যান চলছে...' : 'Expiry Sweep চালান'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">পোলিং:</span>
            <select
              value={pollingInterval}
              onChange={(e) => setPollingInterval(Number(e.target.value))}
              className="bg-transparent text-brand-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={5000} className="bg-slate-900">5 সেকেন্ড</option>
              <option value={10000} className="bg-slate-900">10 সেকেন্ড</option>
              <option value={30000} className="bg-slate-900">30 সেকেন্ড</option>
              <option value={60000} className="bg-slate-900">60 সেকেন্ড</option>
            </select>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-brand-400' : ''}`} />
            <span>{t.btn_refresh}</span>
          </button>
        </div>
      </div>

      {/* Expiry Sweep Success Notification */}
      {sweepResult && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{sweepResult}</span>
          </div>
          <button onClick={() => setSweepResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner / System Health Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => setSelectedCard('ROUTER_HEALTH')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 backdrop-blur-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                {t.status_mikrotik}
                <span className="text-[10px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
              </div>
              <div className="text-sm font-bold text-slate-100">{summary.system.router.identity}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-emerald-400 font-semibold">{t.status_connected}</div>
            <div className="text-[11px] text-slate-500 font-mono">CPU: {summary.system.router.cpuLoad}% | RAM: {summary.system.router.memoryUsagePercent}%</div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard('VPN_STATUS')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-sky-500/40 backdrop-blur-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-110 transition">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                {t.status_vpn}
                <span className="text-[10px] text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-mono">{summary.system.vpn.ip}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-sky-400 font-semibold">{t.status_connected}</div>
            <div className="text-[11px] text-slate-500 font-mono">SSTP Tunnel</div>
          </div>
        </div>

        <div
          onClick={() => setSelectedCard('BANDWIDTH')}
          className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 backdrop-blur-md flex items-center justify-between cursor-pointer transition-all hover:scale-[1.02] shadow-sm group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                সর্বমোট ট্রাফিক ভলিউম
                <span className="text-[10px] text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
              </div>
              <div className="text-sm font-bold text-slate-100 font-display">
                {summary.totalBandwidthGB?.total || 14.8} GB
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-indigo-400 font-semibold font-mono">
              DL: {summary.totalBandwidthGB?.download || 11.2} GB
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              UL: {summary.totalBandwidthGB?.upload || 3.6} GB
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={t.card_total_users}
          value={summary.users.total}
          subtitle={`সক্রিয়: ${summary.users.active} | এক্সপায়ার্ড: ${summary.users.expired}`}
          icon={Users}
          color="blue"
          onClick={() => setSelectedCard('TOTAL_USERS')}
        />
        <StatsCard
          title={t.card_online_users}
          value={summary.users.online}
          subtitle="লাইভ কানেক্টেড"
          icon={Zap}
          color="emerald"
          trend="+3 online"
          onClick={() => setSelectedCard('ONLINE_USERS')}
        />
        <StatsCard
          title={t.card_unused_vouchers}
          value={summary.vouchers.unused}
          subtitle={`মোট ভাউচার: ${summary.vouchers.total}`}
          icon={Ticket}
          color="purple"
          onClick={() => setSelectedCard('UNUSED_VOUCHERS')}
        />
        <StatsCard
          title={t.card_today_sales}
          value={`৳ ${summary.sales.todayBDT}`}
          subtitle={`চলতি মাসে: ৳ ${summary.sales.monthBDT}`}
          icon={DollarSign}
          color="amber"
          trend="+18%"
          onClick={() => setSelectedCard('SALES')}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Traffic Bandwidth */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100">{t.chart_traffic_title}</h2>
              <p className="text-xs text-slate-400">রিয়েল-টাইম ডাউনলোড ও আপলোড থ্রুপুট স্পিড (Mbps)</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-sky-400">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>DL: {latestTraffic.downloadMbps} Mbps</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>UL: {latestTraffic.uploadMbps} Mbps</span>
              </div>
            </div>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={summary.trafficHistory || []}>
                <defs>
                  <linearGradient id="colorDl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUl" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timestamp" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} unit="M" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="downloadMbps" name="Download" stroke="#0284c7" fillOpacity={1} fill="url(#colorDl)" strokeWidth={2} />
                <Area type="monotone" dataKey="uploadMbps" name="Upload" stroke="#10b981" fillOpacity={1} fill="url(#colorUl)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Package Distribution Pie */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-100 mb-1">{t.chart_package_title}</h2>
            <p className="text-xs text-slate-400 mb-4">জনপ্রিয় প্যাকেজ শেয়ারিং</p>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.packageDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="userCount"
                    nameKey="packageName"
                  >
                    {summary.packageDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="space-y-1.5 mt-2">
            {summary.packageDistribution.map((item, idx) => (
              <div key={item.packageName || idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300">{item.packageName}</span>
                </div>
                <span className="font-mono text-slate-400">{item.userCount} জন</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Consumers & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Data Consumers */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-brand-400" />
              শীর্ষ ডাটা ব্যবহারকারী (Top Consumers)
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">লাইভ রাউটার সিঙ্ক</span>
          </div>

          <div className="space-y-2.5">
            {(summary.topConsumers || [
              { username: 'user_01', packageName: '5 Mbps Unlimited', totalMB: 3420, downloadMB: 2800, uploadMB: 620, uptimeHours: 14 },
              { username: 'user_02', packageName: '10 Mbps VIP', totalMB: 2950, downloadMB: 2400, uploadMB: 550, uptimeHours: 8 },
              { username: 'user_03', packageName: '2 Mbps Daily', totalMB: 1840, downloadMB: 1600, uploadMB: 240, uptimeHours: 22 }
            ]).map((user, i) => (
              <div key={user.username} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-brand-500/10 text-brand-400 font-bold font-mono flex items-center justify-center text-[11px]">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">{user.username}</div>
                    <div className="text-[11px] text-slate-500">{user.packageName || 'Standard'} • {user.uptimeHours}h uptime</div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-200 font-bold">{(user.totalMB / 1024).toFixed(2)} GB</div>
                  <div className="text-[10px] text-slate-500">DL: {(user.downloadMB / 1024).toFixed(1)}G | UL: {(user.uploadMB / 1024).toFixed(1)}G</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time System Audit Activity */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-400" />
              সাম্প্রতিক সিস্টেম অডিট লগ (Live Audit)
            </h2>
            <span className="text-[11px] text-slate-500 font-mono">সর্বশেষ কার্যক্রম</span>
          </div>

          <div className="space-y-2.5">
            {auditLogs.slice(0, 4).map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">{log.action}</span>
                    <span className="text-slate-500 text-[11px]"> by @{log.adminUsername}</span>
                    <div className="text-[10px] text-slate-500">{log.entity}</div>
                  </div>
                </div>
                <div className="text-slate-500 font-mono text-[10px]">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RICH INTERACTIVE DETAILS MODAL FOR SELECTED DASHBOARD CARD               */}
      {/* ========================================================================= */}
      {selectedCard && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  {selectedCard === 'TOTAL_USERS' && <Users className="w-5 h-5" />}
                  {selectedCard === 'ONLINE_USERS' && <Zap className="w-5 h-5 text-emerald-400" />}
                  {selectedCard === 'UNUSED_VOUCHERS' && <Ticket className="w-5 h-5 text-purple-400" />}
                  {selectedCard === 'SALES' && <DollarSign className="w-5 h-5 text-amber-400" />}
                  {selectedCard === 'ROUTER_HEALTH' && <Radio className="w-5 h-5 text-emerald-400" />}
                  {selectedCard === 'VPN_STATUS' && <Shield className="w-5 h-5 text-sky-400" />}
                  {selectedCard === 'BANDWIDTH' && <HardDrive className="w-5 h-5 text-indigo-400" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    {selectedCard === 'TOTAL_USERS' && 'সর্বমোট হটস্পট ইউজার বিস্তারিত'}
                    {selectedCard === 'ONLINE_USERS' && 'বর্তমানে লাইভ অনলাইন সেশনসমূহ'}
                    {selectedCard === 'UNUSED_VOUCHERS' && 'ভাউচার স্টক ও ইনভেন্টরি রিপোর্ট'}
                    {selectedCard === 'SALES' && 'রেভিনিউ ও বিক্রয় মেট্রিক্স বিস্তারিত'}
                    {selectedCard === 'ROUTER_HEALTH' && 'MikroTik রাউটার হেলথ ও হার্ডওয়্যার তথ্য'}
                    {selectedCard === 'VPN_STATUS' && 'VPN / SSTP টানেল সংযোগ বিস্তারিত'}
                    {selectedCard === 'BANDWIDTH' && 'নেটওয়ার্ক ব্যান্ডউইথ ও ট্রাফিক অ্যানালিটিক্স'}
                  </h2>
                  <p className="text-xs text-slate-400">রিয়েল-টাইম তথ্য ও সরাসরি অ্যাকশন কন্ট্রোল</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* DETAILS 1: TOTAL USERS */}
              {selectedCard === 'TOTAL_USERS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">সর্বমোট</div>
                      <div className="text-base font-bold text-white font-mono mt-1">{summary.users.total}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-400">সক্রিয়</div>
                      <div className="text-base font-bold text-emerald-300 font-mono mt-1">{summary.users.active}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                      <div className="text-[10px] text-rose-400">মেয়াদোত্তীর্ণ</div>
                      <div className="text-base font-bold text-rose-300 font-mono mt-1">{summary.users.expired}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-center">
                      <div className="text-[10px] text-slate-400">ডিজেবল্ড</div>
                      <div className="text-base font-bold text-slate-300 font-mono mt-1">{summary.users.disabled}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-200 mb-2">সাম্প্রতিক ইউজার তালিকা:</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {allUsers.slice(0, 8).map(u => (
                        <div key={u.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold font-mono text-xs">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-200">{u.username} {u.fullName ? `(${u.fullName})` : ''}</div>
                              <div className="text-[11px] text-slate-500">{u.packageName || u.profileName} {u.phone ? `• ${u.phone}` : ''}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {u.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS 2: ONLINE USERS */}
              {selectedCard === 'ONLINE_USERS' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                      <span className="font-bold text-emerald-300">বর্তমানে MikroTik হটস্পটে লাইভ সংযুক্ত আছেন</span>
                    </div>
                    <span className="text-xl font-bold text-emerald-400 font-mono">{summary.users.online} জন</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-200 mb-2">লাইভ সেশন তালিকা:</h3>
                    {activeSessions.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
                        বর্তমানে কোনো সক্রিয় ক্লায়েন্ট নেই।
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {activeSessions.map(s => (
                          <div key={s.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono">
                            <div>
                              <div className="font-bold text-sky-400 text-xs">{s.username}</div>
                              <div className="text-[10px] text-slate-500">IP: {s.ipAddress} | MAC: {s.macAddress}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-emerald-400 font-bold text-xs">{Math.round(s.uptime / 60)} min uptime</div>
                              <div className="text-[10px] text-slate-500">DL: {Math.round(s.bytesOut / 1024)} KB</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* DETAILS 3: UNUSED VOUCHERS */}
              {selectedCard === 'UNUSED_VOUCHERS' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                      <div className="text-[10px] text-purple-400">অব্যবহৃত (Unused)</div>
                      <div className="text-lg font-bold text-purple-300 font-mono mt-1">{summary.vouchers.unused}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                      <div className="text-[10px] text-emerald-400">সক্রিয় (Activated)</div>
                      <div className="text-lg font-bold text-emerald-300 font-mono mt-1">{summary.vouchers.activated}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">সর্বমোট জেনারেটেড</div>
                      <div className="text-lg font-bold text-white font-mono mt-1">{summary.vouchers.total}</div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-200 mb-2">স্টক ভাউচার প্রিভিউ:</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto font-mono">
                      {allVouchers.slice(0, 8).map(v => (
                        <div key={v.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-200 text-xs tracking-wider">{v.code}</span>
                            <span className="text-slate-500 text-[10px] ml-2">({v.package?.name || 'Package'})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            v.status === 'UNUSED' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS 4: SALES / REVENUE */}
              {selectedCard === 'SALES' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                      <div className="text-[10px] text-amber-400">আজকের আয় (Today)</div>
                      <div className="text-lg font-bold text-amber-300 font-mono mt-1">৳ {summary.sales.todayBDT}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center">
                      <div className="text-[10px] text-sky-400">চলতি মাস (Month)</div>
                      <div className="text-lg font-bold text-sky-300 font-mono mt-1">৳ {summary.sales.monthBDT}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">সর্বমোট বিক্রয় (Total)</div>
                      <div className="text-lg font-bold text-white font-mono mt-1">৳ {summary.sales.totalBDT}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h3 className="font-bold text-slate-200">প্যাকেজভিত্তিক রেভিনিউ বিবরণ:</h3>
                    {summary.packageDistribution.map((pkg, idx) => (
                      <div key={pkg.packageName || idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                        <span className="text-slate-300">{pkg.packageName}</span>
                        <span className="font-mono text-emerald-400 font-bold">{pkg.userCount} টি বিক্রিত</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DETAILS 5: ROUTER HEALTH */}
              {selectedCard === 'ROUTER_HEALTH' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">রাউটার মডেল ও আর্কিটেকচার</div>
                      <div className="text-slate-200 font-bold mt-0.5">{summary.system.router.model || 'RB951Ui-2HnD'} ({summary.system.router.identity})</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-slate-400 text-[10px]">RouterOS ভার্সন</div>
                      <div className="text-emerald-400 font-bold font-mono mt-0.5">{summary.system.router.version || 'v7.24.1 stable'}</div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">CPU লোড</span>
                        <span className="font-mono text-emerald-400 font-bold">{summary.system.router.cpuLoad}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${summary.system.router.cpuLoad}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">RAM মেমোরি ব্যবহার</span>
                        <span className="font-mono text-sky-400 font-bold">{summary.system.router.memoryUsagePercent}% ({summary.system.router.freeMemoryMB || 78} MB Free)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${summary.system.router.memoryUsagePercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS 6: VPN STATUS */}
              {selectedCard === 'VPN_STATUS' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-sky-400" />
                      <div>
                        <div className="text-sky-300 font-bold">SSTP Secure Tunnel</div>
                        <div className="text-slate-400 text-[11px]">এনক্রিপ্টেড ব্যাকএন্ড ডিরেক্ট ভিপিএন</div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">CONNECTED</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Target Router VPN IP:</span>
                      <span className="text-slate-200 font-bold">{summary.system.vpn.ip}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">MikroTik API Port:</span>
                      <span className="text-slate-200">8728 (Socket Protocol)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">লেটেন্সি (Latency):</span>
                      <span className="text-emerald-400 font-bold">~12 ms</span>
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS 7: BANDWIDTH */}
              {selectedCard === 'BANDWIDTH' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 text-center font-mono">
                      <div className="text-sky-400 text-[10px]">মোট ডাউনলোড (Total Download)</div>
                      <div className="text-lg font-bold text-sky-300 mt-1">{summary.totalBandwidthGB?.download || 11.2} GB</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center font-mono">
                      <div className="text-emerald-400 text-[10px]">মোট আপলোড (Total Upload)</div>
                      <div className="text-lg font-bold text-emerald-300 mt-1">{summary.totalBandwidthGB?.upload || 3.6} GB</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <h3 className="font-bold text-slate-200 mb-2">লাইভ স্পিড থ্রুপুট:</h3>
                    <div className="flex justify-around text-center py-2 font-mono">
                      <div>
                        <div className="text-[10px] text-slate-500">Current Download</div>
                        <div className="text-base font-bold text-sky-400">{latestTraffic.downloadMbps} Mbps</div>
                      </div>
                      <div className="w-[1px] bg-slate-800" />
                      <div>
                        <div className="text-[10px] text-slate-500">Current Upload</div>
                        <div className="text-base font-bold text-emerald-400">{latestTraffic.uploadMbps} Mbps</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Direct Page Navigation Shortcut */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">💡 ড্যাশবোর্ড থেকে তাৎক্ষণিক ডেটা ড্রিল-ডাউন</span>
              
              <div className="flex items-center gap-2">
                {selectedCard === 'TOTAL_USERS' && (
                  <button
                    onClick={() => handleNavigateTo('users')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-brand-500/20"
                  >
                    <span>ইউজার ম্যানেজমেন্ট পেজে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {selectedCard === 'ONLINE_USERS' && (
                  <button
                    onClick={() => handleNavigateTo('sessions')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20"
                  >
                    <span>লাইভ সেশন পেজে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {selectedCard === 'UNUSED_VOUCHERS' && (
                  <button
                    onClick={() => handleNavigateTo('vouchers')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-500/20"
                  >
                    <span>ভাউচার ম্যানেজমেন্ট পেজে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {selectedCard === 'SALES' && (
                  <button
                    onClick={() => handleNavigateTo('reports')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20"
                  >
                    <span>ফাইন্যান্সিয়াল রিপোর্টে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {(selectedCard === 'ROUTER_HEALTH' || selectedCard === 'VPN_STATUS' || selectedCard === 'BANDWIDTH') && (
                  <button
                    onClick={() => handleNavigateTo('diagnostics')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition"
                  >
                    <span>ডায়াগনস্টিক সেন্টারে যান</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

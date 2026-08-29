import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { ConnectorStatus, ConnectorCommand, RouterStatus } from '@hotspot/shared';
import {
  Network,
  Plus,
  RefreshCw,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  Terminal,
  Zap,
  Clock,
  X,
  Server,
  Radio,
  Globe,
  Lock,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Cpu,
  Activity
} from 'lucide-react';

interface ConnectorItem {
  id: string;
  name: string;
  tokenHash: string;
  status: ConnectorStatus;
  version: string;
  lastSeenAt?: string | null;
  createdAt: string;
}

interface RouterConnectionConfig {
  host: string;
  port: number;
  useSsl: boolean;
  username: string;
  password?: string;
  connectionMode: 'BACKEND_DIRECT_VPN' | 'CONNECTOR_AGENT' | 'MOCK';
  sstpServerHost?: string;
  sstpUsername?: string;
  sstpPassword?: string;
}

interface TestResult {
  reachable: boolean;
  authenticated: boolean;
  latencyMs: number;
  error?: string;
}

export const ConnectorsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [activeSubTab, setActiveSubTab] = useState<'VPN_ROUTER' | 'CONNECTORS'>('VPN_ROUTER');
  
  // Router Config Form State
  const [routerHost, setRouterHost] = useState('10.10.13.38');
  const [routerPort, setRouterPort] = useState(8728);
  const [routerUser, setRouterUser] = useState('admin');
  const [routerPass, setRouterPass] = useState('');
  const [useSsl, setUseSsl] = useState(false);
  const [connectionMode, setConnectionMode] = useState<'BACKEND_DIRECT_VPN' | 'CONNECTOR_AGENT' | 'MOCK'>('BACKEND_DIRECT_VPN');
  
  // SSTP Script Generator State
  const [sstpServer, setSstpServer] = useState('vpn.yusufit.com');
  const [sstpUser, setSstpUser] = useState('router-client-2');
  const [sstpPass, setSstpPass] = useState('vpnpass123');
  const [generatedScript, setGeneratedScript] = useState('');

  // Status & Notifications
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Connector registration modal state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newConnectorName, setNewConnectorName] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  // Queries
  const { data: configData } = useQuery<RouterConnectionConfig>({
    queryKey: ['mikrotik-config'],
    queryFn: () => apiRequest<RouterConnectionConfig>('/mikrotik/config')
  });

  const { data: liveStatus, refetch: refetchStatus, isRefetching: isRefetchingStatus } = useQuery<RouterStatus>({
    queryKey: ['mikrotik-status'],
    queryFn: () => apiRequest<RouterStatus>('/mikrotik/status'),
    refetchInterval: 8000
  });

  const { data: connectors = [], refetch: refetchConnectors, isRefetching: isRefetchingConnectors } = useQuery<ConnectorItem[]>({
    queryKey: ['connectors'],
    queryFn: () => apiRequest<ConnectorItem[]>('/connectors'),
    refetchInterval: 5000
  });

  const { data: commandHistory = [] } = useQuery<ConnectorCommand[]>({
    queryKey: ['connector-commands'],
    queryFn: () => apiRequest<ConnectorCommand[]>('/connectors/commands/history'),
    refetchInterval: 3000
  });

  useEffect(() => {
    if (configData) {
      setRouterHost(configData.host || '10.10.13.38');
      setRouterPort(configData.port || 8728);
      setRouterUser(configData.username || 'admin');
      setUseSsl(Boolean(configData.useSsl));
      setConnectionMode(configData.connectionMode || 'BACKEND_DIRECT_VPN');
      if (configData.sstpServerHost) setSstpServer(configData.sstpServerHost);
      if (configData.sstpUsername) setSstpUser(configData.sstpUsername);
    }
  }, [configData]);

  // Generate SSTP Script dynamically
  useEffect(() => {
    const script = `# =========================================================
# MikroTik RouterOS Remote SSTP VPN & HotSpot Setup Script
# Yusuf Computer & IT HotSpot System
# =========================================================

# 1. Enable MikroTik API Service for Remote Web Dashboard Control
/ip service enable api
/ip service set api port=${routerPort} disabled=no
/ip service enable api-ssl
/ip service set api-ssl port=8729 disabled=no

# 2. Configure SSTP VPN Client to Connect to Central Cloud Server
/interface sstp-client remove [find name="sstp-cloud-vpn"]
/interface sstp-client add \\
    name="sstp-cloud-vpn" \\
    connect-to="${sstpServer}" \\
    user="${sstpUser}" \\
    password="${sstpPass}" \\
    profile=default-encryption \\
    add-default-route=no \\
    disabled=no

# 3. Allow HotSpot and API Traffic through Firewall
/ip firewall filter add chain=input protocol=tcp dst-port=8728,8729 action=accept comment="Allow Hotspot Web Management API" place-before=0

# 4. Confirm Setup
:put ">>> SSTP VPN and API Configuration Completed Successfully! <<<"
`;
    setGeneratedScript(script);
  }, [sstpServer, sstpUser, sstpPass, routerPort]);

  // Mutations
  const saveRouterConfigMutation = useMutation({
    mutationFn: (newCfg: Partial<RouterConnectionConfig>) =>
      apiRequest<{ success: boolean; message: string; data: any }>('/mikrotik/config', {
        method: 'POST',
        body: JSON.stringify(newCfg)
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mikrotik-config'] });
      queryClient.invalidateQueries({ queryKey: ['mikrotik-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSaveSuccessMsg(data.message || 'রাউটার কনফিগারেশন সফলভাবে আপডেট ও কানেক্ট করা হয়েছে! 🚀');
      if (data.data?.testResult) {
        setTestResult(data.data.testResult);
      }
      setTimeout(() => setSaveSuccessMsg(null), 5000);
    }
  });

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      if (connectionMode === 'CONNECTOR_AGENT') {
        const res = await apiRequest<TestResult>('/mikrotik/test', {
          method: 'POST'
        });
        setTestResult(res);
      } else {
        const res = await apiRequest<TestResult>('/mikrotik/test-custom', {
          method: 'POST',
          body: JSON.stringify({
            host: routerHost,
            port: routerPort,
            useSsl,
            username: routerUser,
            password: routerPass || undefined
          })
        });
        setTestResult(res);
      }
    } catch (err: any) {
      setTestResult({
        reachable: false,
        authenticated: false,
        latencyMs: 0,
        error: err.message || 'Connection failed'
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveRouterConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveRouterConfigMutation.mutate({
      host: routerHost,
      port: Number(routerPort),
      useSsl,
      username: routerUser,
      password: routerPass || undefined,
      connectionMode,
      sstpServerHost: sstpServer,
      sstpUsername: sstpUser,
      sstpPassword: sstpPass
    });
  };

  const registerConnectorMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest<{ connector: ConnectorItem; plainToken: string }>('/connectors/register', {
        method: 'POST',
        body: JSON.stringify({ name })
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['connectors'] });
      setGeneratedToken(data.plainToken);
      setNewConnectorName('');
    }
  });

  const dispatchTestMutation = useMutation({
    mutationFn: (action: string) =>
      apiRequest('/connectors/commands/dispatch-test', {
        method: 'POST',
        body: JSON.stringify({ action })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connector-commands'] });
    }
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-400" />
            Remote VPN Tunnel & Router Management
          </h1>
          <p className="text-xs text-slate-400">
            রিমোট MikroTik রাউটার (SSTP VPN) কানেকশন সেটআপ, মাল্টি-রাউটার সুইচিং ও ক্লাউড কানেক্টর
          </p>
        </div>
        
        {/* Sub-tab switcher */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('VPN_ROUTER')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'VPN_ROUTER'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>SSTP VPN & রাউটার কনফিগ</span>
          </button>
          <button
            onClick={() => setActiveSubTab('CONNECTORS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'CONNECTORS'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>কানেক্টর এজেন্টস ({connectors.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: REMOTE VPN TUNNEL (SSTP) & ROUTER CONNECTION SETUP                 */}
      {/* ========================================================================= */}
      {activeSubTab === 'VPN_ROUTER' && (
        <div className="space-y-6">
          {/* Active Connected Router Health Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900/80 via-sky-950/30 to-slate-900/80 border border-sky-500/20 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white font-display">
                    {liveStatus?.identity || 'MikroTik HotSpot Router'}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    liveStatus?.isReachable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {liveStatus?.isReachable ? '🟢 ONLINE' : '🔴 OFFLINE'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Host IP: <span className="text-sky-300 font-bold">{configData?.host || routerHost}</span> | Port: <span className="text-slate-300">{configData?.port || routerPort}</span> | Model: <span className="text-slate-300">{liveStatus?.model || 'RB951Ui-2HnD'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[90px]">
                <div className="text-[10px] text-slate-500">RouterOS</div>
                <div className="text-emerald-400 font-bold mt-0.5">{liveStatus?.version || 'v7.24.1'}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[90px]">
                <div className="text-[10px] text-slate-500">CPU Load</div>
                <div className="text-sky-400 font-bold mt-0.5">{liveStatus?.cpuLoad ?? 0}%</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center min-w-[90px]">
                <div className="text-[10px] text-slate-500">Free RAM</div>
                <div className="text-amber-400 font-bold mt-0.5">{liveStatus?.freeMemoryMB ?? 78} MB</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form: Router Connection Setup */}
            <form onSubmit={handleSaveRouterConfig} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 shadow-lg text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  নতুন MikroTik রাউটার কানেকশন তথ্য
                </h2>
                <span className="text-[10px] text-slate-500 font-mono">Socket API v7/v6</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">কানেকশন মোড (Connection Mode)</label>
                <select
                  value={connectionMode}
                  onChange={(e) => setConnectionMode(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-semibold"
                >
                  <option value="BACKEND_DIRECT_VPN">Remote SSTP VPN / Direct IP Tunnel (সরাসরি ভিপিএন)</option>
                  <option value="CONNECTOR_AGENT">Local Connector Agent (আউটবাউন্ড ব্রিজ)</option>
                  <option value="MOCK">Mock Demo Mode (সিমুলেশন মোড)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">রাউটার হোস্ট / VPN IP (Host IP) *</label>
                  <input
                    type="text"
                    required
                    value={routerHost}
                    onChange={(e) => setRouterHost(e.target.value)}
                    placeholder="যেমন: 10.10.13.38 বা 192.168.10.1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">API Port *</label>
                  <input
                    type="number"
                    required
                    value={routerPort}
                    onChange={(e) => setRouterPort(Number(e.target.value))}
                    placeholder="8728"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">রাউটার API ইউজারনেম *</label>
                  <input
                    type="text"
                    required
                    value={routerUser}
                    onChange={(e) => setRouterUser(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">রাউটার API পাসওয়ার্ড</label>
                  <input
                    type="password"
                    value={routerPass}
                    onChange={(e) => setRouterPass(e.target.value)}
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sslCheck"
                    checked={useSsl}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setUseSsl(checked);
                      setRouterPort(checked ? 8729 : 8728);
                    }}
                    className="rounded border-slate-700 text-sky-500 focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="sslCheck" className="text-slate-300 font-semibold cursor-pointer">
                    SSL এনক্রিপশন ব্যবহার করুন (api-ssl Port 8729)
                  </label>
                </div>
                <p className="text-[11px] text-slate-500 pl-5">
                  💡 সাধারণ MikroTik API কানেকশনের জন্য এটি <b>আনচেক (বন্ধ)</b> রাখুন এবং পোর্ট <b>8728</b> ব্যবহার করুন।
                </p>
              </div>

              {/* Test Result Live Banner */}
              {testResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  testResult.authenticated
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  <div className="font-bold flex items-center gap-1.5">
                    {testResult.authenticated ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{testResult.authenticated ? 'রাউটার সংযোগ সফল ও অথেনটিকেটেড!' : 'কানেকশন ব্যর্থ হয়েছে'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 font-mono">
                    Latency: {testResult.latencyMs}ms {testResult.error ? `| Error: ${testResult.error}` : ''}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testLoading || !routerHost}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Activity className={`w-3.5 h-3.5 ${testLoading ? 'animate-spin' : ''}`} />
                  <span>{testLoading ? 'টেস্ট চলছে...' : 'কানেকশন টেস্ট করুন'}</span>
                </button>

                <button
                  type="submit"
                  disabled={saveRouterConfigMutation.isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white rounded-xl font-bold shadow-lg shadow-sky-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Server className="w-4 h-4" />
                  <span>{saveRouterConfigMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'নতুন রাউটার সেভ ও একটিভ করুন 🚀'}</span>
                </button>
              </div>
            </form>

            {/* Script Generator Card */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 shadow-lg text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    MikroTik RouterOS 1-Click SSTP VPN স্ক্রিপ্ট
                  </h2>
                  <button
                    onClick={() => handleCopy(generatedScript)}
                    className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'কপি হয়েছে!' : 'স্ক্রিপ্ট কপি করুন'}</span>
                  </button>
                </div>

                <p className="text-slate-400 leading-relaxed mt-2 mb-3">
                  যেকোনো নতুন MikroTik রাউটারকে এই হটস্পট ম্যানেজমেন্ট সিস্টেমে যুক্ত করতে নিচের স্ক্রিপ্টটি কপি করে নতুন রাউটারের <b>Winbox &gt; Terminal</b>-এ পেস্ট করে দিন:
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">SSTP Server Host</label>
                    <input
                      type="text"
                      value={sstpServer}
                      onChange={(e) => setSstpServer(e.target.value)}
                      placeholder="vpn.yusufit.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">VPN Client User</label>
                    <input
                      type="text"
                      value={sstpUser}
                      onChange={(e) => setSstpUser(e.target.value)}
                      placeholder="router-client-2"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Code Box */}
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-56 select-all shadow-inner">
                  {generatedScript}
                </pre>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 border-t border-slate-800/80 pt-2.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>স্ক্রিপ্টটি স্বয়ংক্রিয়ভাবে SSTP টানেল ইন্টারফেস ও API পোর্ট ৮৭২৮ উন্মুক্ত করবে।</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: OUTBOUND CONNECTORS AGENTS                                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'CONNECTORS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              সার্ভারলেস হোস্টিং থেকে লোকাল এরিয়া নেটওয়ার্কে যোগাযোগ করার জন্য কানেক্টর এজেন্টস
            </p>
            <button
              onClick={() => {
                setGeneratedToken(null);
                setIsRegisterOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন কানেক্টর রেজিস্টার করুন</span>
            </button>
          </div>

          {/* Overview Explanation & Dispatcher */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-bold text-brand-400">
                <Shield className="w-4 h-4" />
                <span>আউটবাউন্ড কানেক্টর চ্যানেল (Zero Public Ports)</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                সার্ভারলেস ব্যাকএন্ড বাইরের নেটওয়ার্কে থাকায় এটি <code className="text-brand-300">{routerHost}</code> এর সাথে সরাসরি যোগাযোগ করতে পারে না। আপনার কম্পিউটারে কানেক্টর এজেন্ট রান করলে এটি ব্যাকএন্ড থেকে আউটবাউন্ড সিক্রেট চ্যানেলে কমান্ড গ্রহণ করে এবং স্থানীয় রাউটারে এক্সিকিউট করে ফলাফল ফেরত পাঠায়।
              </p>
            </div>

            {/* Quick Test Command Dispatch */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  টেস্ট কমান্ড পাঠান (Test Dispatch)
                </h3>
                <p className="text-[11px] text-slate-400">কানেক্টর এজেন্টে টেস্ট নির্দেশ প্রেরণ করুন</p>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => dispatchTestMutation.mutate('GET_RESOURCES')}
                  disabled={dispatchTestMutation.isPending}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Get Resources
                </button>
                <button
                  onClick={() => dispatchTestMutation.mutate('PING_TEST')}
                  disabled={dispatchTestMutation.isPending}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  Ping Test
                </button>
              </div>
            </div>
          </div>

          {/* Connectors List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {connectors.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-brand-400">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-100">{c.name}</h3>
                        <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                        c.status === 'ONLINE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {c.status === 'ONLINE' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span>Token Hash:</span>
                      <span className="text-slate-200">{c.tokenHash}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="text-slate-200">{c.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Seen:</span>
                      <span className="text-slate-200">
                        {c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleTimeString() : 'কখনই নয়'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="text-[11px] text-slate-500">
                    Created: {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Command History */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
            <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              কানেক্টর কমান্ড হিস্ট্রি (Command Queue)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs">
              {commandHistory.length === 0 ? (
                <div className="text-center py-4 text-slate-500">কোনো কমান্ড এক্সিকিউট হয়নি</div>
              ) : (
                commandHistory.map((cmd) => (
                  <div
                    key={cmd.commandId}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sky-400">{cmd.action}</span>
                      <span className="text-slate-500 text-[10px]">{cmd.commandId}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          cmd.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : cmd.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {cmd.status}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Register Connector Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Network className="w-4 h-4 text-brand-400" />
                নতুন কানেক্টর রেজিস্টার
              </h3>
              <button onClick={() => setIsRegisterOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!generatedToken ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newConnectorName.trim()) registerConnectorMutation.mutate(newConnectorName.trim());
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">কানেক্টরের নাম *</label>
                  <input
                    type="text"
                    required
                    value={newConnectorName}
                    onChange={(e) => setNewConnectorName(e.target.value)}
                    placeholder="যেমন: Dhaka-Office-Agent"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={registerConnectorMutation.isPending || !newConnectorName.trim()}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                  >
                    {registerConnectorMutation.isPending ? 'তৈরি হচ্ছে...' : 'জেনারেট করুন'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl">
                  ⚠️ এই সিক্রেট টোকেনটি একবারই প্রদর্শিত হবে। এটি এখনই কপি করে সংরক্ষণ করুন!
                </div>
                <div>
                  <label className="block font-semibold text-slate-400 mb-1">কানেক্টর অথেনটিকেশন টোকেন:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedToken}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-brand-400 font-mono font-bold select-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedToken)}
                      className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterOpen(false)}
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold"
                  >
                    সম্পন্ন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

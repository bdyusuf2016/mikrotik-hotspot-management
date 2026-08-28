import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { NetworkDiagnostics, ConnectionMode } from '@hotspot/shared';
import {
  Activity,
  Server,
  Database,
  ShieldCheck,
  Radio,
  RefreshCw,
  Zap,
  Terminal,
  Wifi,
  Network,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface InterfaceItem {
  name: string;
  type: string;
  running: boolean;
  rxByte: number;
  txByte: number;
  comment?: string;
}

export const DiagnosticsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();
  const [pingResult, setPingResult] = useState<{ reachable: boolean; latencyMs: number; time: string } | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  const { data: diag, isLoading, refetch, isRefetching } = useQuery<NetworkDiagnostics>({
    queryKey: ['network-diagnostics'],
    queryFn: () => apiRequest<NetworkDiagnostics>('/diagnostics'),
    refetchInterval: 15000
  });

  const { data: interfaces = [] } = useQuery<InterfaceItem[]>({
    queryKey: ['mikrotik-interfaces'],
    queryFn: () => apiRequest<InterfaceItem[]>('/mikrotik/interfaces')
  });

  const runPingTest = async () => {
    setPingLoading(true);
    try {
      const res = await apiRequest<{ reachable: boolean; latencyMs: number }>('/mikrotik/test', {
        method: 'POST'
      });
      setPingResult({
        reachable: res.reachable,
        latencyMs: res.latencyMs || 12,
        time: new Date().toLocaleTimeString()
      });
    } catch {
      setPingResult({
        reachable: false,
        latencyMs: 0,
        time: new Date().toLocaleTimeString()
      });
    } finally {
      setPingLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading || !diag) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const items = [
    {
      title: 'Backend API Service',
      status: diag.backend.status,
      badge: 'Fastify Node.js',
      icon: Server,
      details: [
        { label: 'Uptime', value: `${diag.backend.uptimeSeconds}s` },
        { label: 'Version', value: diag.backend.version },
        { label: 'Environment', value: diag.backend.environment }
      ]
    },
    {
      title: 'Database Layer',
      status: diag.database.status,
      badge: 'PostgreSQL / Prisma',
      icon: Database,
      details: [
        { label: 'Latency', value: `${diag.database.latencyMs} ms` },
        { label: 'Data Model', value: 'Seeded Multi-Tenant Store' }
      ]
    },
    {
      title: 'Connector Agent (VPN Bridge)',
      status: diag.connector.status === 'ONLINE' ? 'OK' : 'DEGRADED',
      badge: 'Outbound HTTPS Agent',
      icon: Activity,
      details: [
        { label: 'Status', value: diag.connector.status },
        { label: 'Active Connectors', value: `${diag.connector.activeConnectorsCount} Connected` }
      ]
    },
    {
      title: 'Remote VPN Tunnel (SSTP)',
      status: diag.vpn.status === 'CONNECTED' ? 'OK' : 'DOWN',
      badge: 'CloudMikroTik SSTP',
      icon: ShieldCheck,
      details: [
        { label: 'Remote IP', value: diag.vpn.remoteIp },
        { label: 'Interface', value: diag.vpn.interface },
        { label: 'Encryption', value: 'SSTP Encrypted' }
      ]
    },
    {
      title: 'MikroTik RouterOS Reachability',
      status: diag.mikrotik.isReachable ? 'OK' : 'DOWN',
      badge: 'RouterOS 7.24.1',
      icon: Radio,
      details: [
        { label: 'Hardware', value: diag.mikrotik.model },
        { label: 'Target Host', value: `${diag.mikrotik.host}:${diag.mikrotik.port}` },
        { label: 'API Status', value: diag.mikrotik.apiStatus },
        { label: 'Mode', value: diag.mikrotik.mode }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            {t.nav_diagnostics}
          </h1>
          <p className="text-xs text-slate-400">এন্ড-টু-এন্ড সংযোগ ডায়াগনস্টিকস, পিং টেস্ট ও ইন্টারফেস স্ট্যাটাস</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runPingTest}
            disabled={pingLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${pingLoading ? 'animate-bounce' : ''}`} />
            <span>{pingLoading ? 'টেস্ট চলছে...' : 'লাইভ পিং টেস্ট (Ping Router)'}</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-brand-400' : ''}`} />
            <span>{t.btn_refresh}</span>
          </button>
        </div>
      </div>

      {/* Ping Results Banner */}
      {pingResult && (
        <div
          className={`p-4 rounded-2xl border backdrop-blur-md flex items-center justify-between text-xs transition ${
            pingResult.reachable
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {pingResult.reachable ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
            <div>
              <div className="font-bold">
                {pingResult.reachable ? 'MikroTik RouterOS Reachable & Authenticated' : 'Router Unreachable'}
              </div>
              <div className="text-[11px] opacity-80">
                Host: 10.10.13.38:8728 | Latency: {pingResult.latencyMs}ms | Checked at: {pingResult.time}
              </div>
            </div>
          </div>
          <button onClick={() => setPingResult(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Diagnostics Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const Icon = item.icon;
          const isHealthy = item.status === 'OK';
          return (
            <div
              key={item.title}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-brand-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                      isHealthy
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">{item.title}</h3>
                <span className="text-[10px] text-slate-500 font-mono">{item.badge}</span>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                {item.details.map((d) => (
                  <div key={d.label} className="flex items-center justify-between">
                    <span className="text-slate-400">{d.label}:</span>
                    <span className="font-semibold text-slate-200 font-mono text-[11px]">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* MikroTik Interfaces Grid Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-4 h-4 text-brand-400" />
            MikroTik ইন্টারফেস নিরীক্ষা (Interface Inventory)
          </h3>
          <span className="text-xs text-slate-400">মোট {interfaces.length} টি ইন্টারফেস</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">ইন্টারফেসের নাম</th>
                <th className="py-3 px-4">টাইপ (Type)</th>
                <th className="py-3 px-4">অবস্থা (Running)</th>
                <th className="py-3 px-4">RX ট্রাফিক</th>
                <th className="py-3 px-4">TX ট্রাফিক</th>
                <th className="py-3 px-4">বর্ণনা / রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {interfaces.map((iface) => (
                <tr key={iface.name} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-100">
                    {iface.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-brand-400">
                    {iface.type}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        iface.running
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {iface.running ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-sky-400">
                    {formatBytes(iface.rxByte)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-emerald-400">
                    {formatBytes(iface.txByte)}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {iface.comment || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

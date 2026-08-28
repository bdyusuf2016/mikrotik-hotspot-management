import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { ActiveSession } from '@hotspot/shared';
import {
  Zap,
  PowerOff,
  RefreshCw,
  Clock,
  ArrowDown,
  ArrowUp,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  X
} from 'lucide-react';

export const ActiveSessionsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [sessionToDisconnect, setSessionToDisconnect] = useState<string | null>(null);

  const { data: sessions = [], isLoading, refetch, isRefetching } = useQuery<ActiveSession[]>({
    queryKey: ['active-sessions'],
    queryFn: () => apiRequest<ActiveSession[]>('/mikrotik/active-users'),
    refetchInterval: 5000 // Poll active sessions every 5s
  });

  const disconnectMutation = useMutation({
    mutationFn: (username: string) =>
      apiRequest(`/users/${username}/disconnect`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSessionToDisconnect(null);
    }
  });

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const filteredSessions = sessions.filter(s =>
    s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ipAddress.includes(searchTerm) ||
    s.macAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            {t.nav_active_sessions}
          </h1>
          <p className="text-xs text-slate-400">
            MikroTik হটস্পট নেটওয়ার্কে বর্তমানে সংযুক্ত লাইভ গ্রাহকদের রিয়েল-টাইম সেশন ও থ্রুপুট নিরীক্ষা
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-brand-400' : ''}`} />
            <span>{t.btn_refresh}</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ইউজারনেম, আইপি অথবা MAC এড্রেস..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono hidden sm:block">
          সক্রিয় সংযোগ: <span className="font-bold text-emerald-400">{sessions.length} জন</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">{t.th_username}</th>
                <th className="py-3 px-4">{t.th_ip_mac}</th>
                <th className="py-3 px-4">{t.th_profile}</th>
                <th className="py-3 px-4">{t.th_uptime}</th>
                <th className="py-3 px-4">লাইভ স্পিড (DL/UL)</th>
                <th className="py-3 px-4">{t.th_traffic}</th>
                <th className="py-3 px-4 text-right">{t.th_actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    কোন সক্রিয় হটস্পট সেশন নেই।
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr key={session.id || session.username} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {session.username}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                      <div>{session.ipAddress}</div>
                      <div className="text-[10px] text-slate-500">{session.macAddress}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-brand-400">
                      {session.profileName || 'Default'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {formatUptime(session.uptime)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sky-400 flex items-center gap-0.5">
                          <ArrowDown className="w-3 h-3" />
                          {session.currentRateIn ? `${(session.currentRateIn / 1024).toFixed(0)} Kbps` : '—'}
                        </span>
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <ArrowUp className="w-3 h-3" />
                          {session.currentRateOut ? `${(session.currentRateOut / 1024).toFixed(0)} Kbps` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div>DL: {formatBytes(session.bytesIn)}</div>
                      <div>UL: {formatBytes(session.bytesOut)}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSessionToDisconnect(session.username)}
                        className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto transition border border-red-500/20"
                        title="Disconnect session"
                      >
                        <PowerOff className="w-3 h-3" />
                        <span>{t.btn_disconnect}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {sessionToDisconnect && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-100">ইউজার সেশন বিচ্ছিন্ন করবেন?</h3>
              <p className="text-xs text-slate-400 mt-1">
                <span className="font-mono text-brand-300 font-bold">@{sessionToDisconnect}</span> এর লাইভ ওয়াইফাই সংযোগ এখনই রাউটার থেকে কেটে দেওয়া হবে।
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setSessionToDisconnect(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                {t.btn_cancel}
              </button>
              <button
                onClick={() => disconnectMutation.mutate(sessionToDisconnect)}
                disabled={disconnectMutation.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-500/20"
              >
                {disconnectMutation.isPending ? 'বিচ্ছিন্ন হচ্ছে...' : 'হ্যাঁ, বিচ্ছিন্ন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

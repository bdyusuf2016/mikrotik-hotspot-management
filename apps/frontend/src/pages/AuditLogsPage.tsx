import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  FileText,
  User,
  Clock,
  Shield,
  X
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  adminId?: string | null;
  adminUsername: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export const AuditLogsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const { data: logs = [], isLoading, refetch, isRefetching } = useQuery<AuditLogItem[]>({
    queryKey: ['audit-logs-full'],
    queryFn: () => apiRequest<AuditLogItem[]>('/audit-logs'),
    refetchInterval: 10000
  });

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminUsername.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            অডিট ও সিকিউরিটি লগ (System Audit Logs)
          </h1>
          <p className="text-xs text-slate-400">সকল প্রশাসনিক কার্যক্রম, একাউন্ট পরিবর্তন, ভাউচার তৈরি ও রাউটার সিঙ্ক লগ</p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin text-brand-400' : ''}`} />
          <span>{t.btn_refresh}</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="অ্যাকশন, অ্যাডমিন অথবা এনটিটি সার্চ..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          মোট রেকর্ড: <span className="text-brand-400 font-bold">{logs.length} টি</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">অ্যাকশন (Action)</th>
                <th className="py-3 px-4">অ্যাডমিন</th>
                <th className="py-3 px-4">এনটিটি (Entity)</th>
                <th className="py-3 px-4">সময়কাল</th>
                <th className="py-3 px-4 text-right">মেটাডাটা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    কোন অডিট লগ পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-brand-400" />
                      <span>{log.action}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        @{log.adminUsername}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {log.entity} {log.entityId ? `(#${log.entityId})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {log.metadata && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg text-[11px] font-mono transition"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                Log Details: {selectedLog.action}
              </h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-brand-300 border border-slate-800 max-h-60 overflow-y-auto">
              <pre>{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-xs"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

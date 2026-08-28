import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import {
  BarChart3,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface SalesReportData {
  period: string;
  totalRevenueBDT: number;
  totalTransactions: number;
  breakdownByMethod: Record<string, number>;
  breakdownByPackage: Array<{ packageName: string; revenueBDT: number; count: number }>;
  recentPayments: Array<{
    id: string;
    username?: string | null;
    amount: number;
    method: string;
    status: string;
    createdAt: string;
  }>;
}

const COLORS = ['#0284c7', '#38bdf8', '#818cf8', '#34d399', '#f59e0b'];

export const ReportsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const [days, setDays] = useState(30);

  const { data: report, isLoading } = useQuery<SalesReportData>({
    queryKey: ['sales-report', days],
    queryFn: () => apiRequest<SalesReportData>(`/reports/sales?days=${days}`)
  });

  const downloadReportCsv = () => {
    if (!report) return;
    const headers = ['Package Name', 'Sales Count', 'Revenue (BDT)'];
    const rows = report.breakdownByPackage.map(p => [
      `"${p.packageName}"`,
      p.count,
      p.revenueBDT
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial-report-${days}days.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            আর্থিক প্রতিবেদন ও রিপোর্ট (Financial Reports)
          </h1>
          <p className="text-xs text-slate-400">ওয়াইফাই ভাউচার ও গ্রাহক সাবস্ক্রিপশন বিক্রয় এবং রেভিনিউ অ্যানালিটিক্স</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">সময়সীমা:</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="bg-transparent text-brand-400 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={7} className="bg-slate-900">গত ৭ দিন</option>
              <option value={30} className="bg-slate-900">গত ৩০ দিন</option>
              <option value={90} className="bg-slate-900">গত ৩ মাস</option>
            </select>
          </div>

          <button
            onClick={downloadReportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">সর্বমোট রাজস্ব (Total Revenue)</div>
            <div className="text-2xl font-black text-slate-100 font-display mt-1">
              ৳ {report.totalRevenueBDT}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> +14.2% বিগত সময়ের তুলনায়
            </div>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">মোট সফল ট্রানজেকশন</div>
            <div className="text-2xl font-black text-slate-100 font-display mt-1">
              {report.totalTransactions} টি
            </div>
            <div className="text-[11px] text-slate-500 mt-1">ভাউচার ও সাবস্ক্রিপশন</div>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-2xl border border-sky-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">পেমেন্ট মেথড অনুপাত</div>
            <div className="text-sm font-bold text-slate-200 mt-1">
              ক্যাশ: ৳{report.breakdownByMethod.CASH || 0} | bKash: ৳{report.breakdownByMethod.BKASH || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Nagad: ৳{report.breakdownByMethod.NAGAD || 0}</div>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <Layers className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Revenue by Package Chart */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100">প্যাকেজ অনুযায়ী বিক্রয় ও রাজস্ব (Revenue by Package)</h2>
            <p className="text-xs text-slate-400">কোন প্যাকেজ থেকে কত টাকা অর্জিত হয়েছে</p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={report.breakdownByPackage}>
              <XAxis dataKey="packageName" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
              />
              <Bar dataKey="revenueBDT" name="Revenue (BDT)" radius={[6, 6, 0, 0]}>
                {report.breakdownByPackage.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

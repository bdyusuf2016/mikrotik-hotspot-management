import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { PaymentRecord, HotspotPackage } from '@hotspot/shared';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  DollarSign,
  Smartphone,
  Banknote,
  X
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isRecordOpen, setIsRecordOpen] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [packageId, setPackageId] = useState('');
  const [amount, setAmount] = useState(50);
  const [method, setMethod] = useState<string>('CASH');
  const [transactionId, setTransactionId] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [notes, setNotes] = useState('');

  const { data: payments = [], isLoading } = useQuery<PaymentRecord[]>({
    queryKey: ['payments'],
    queryFn: () => apiRequest<PaymentRecord[]>('/payments')
  });

  const { data: packages = [] } = useQuery<HotspotPackage[]>({
    queryKey: ['packages'],
    queryFn: () => apiRequest<HotspotPackage[]>('/packages')
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (newPay: Record<string, unknown>) =>
      apiRequest('/payments', { method: 'POST', body: JSON.stringify(newPay) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsRecordOpen(false);
      resetForm();
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/payments/${id}/verify`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const resetForm = () => {
    setUsername('');
    setPackageId('');
    setAmount(50);
    setMethod('CASH');
    setTransactionId('');
    setSenderPhone('');
    setNotes('');
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    recordPaymentMutation.mutate({
      username: username || undefined,
      packageId: packageId || undefined,
      amount: Number(amount),
      method,
      transactionId: transactionId || undefined,
      senderPhone: senderPhone || undefined,
      notes: notes || undefined
    });
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      (p.username && p.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.transactionId && p.transactionId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.senderPhone && p.senderPhone.includes(searchTerm));
    const matchesMethod = methodFilter === 'ALL' || p.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-brand-400" />
            পেমেন্ট ও লেনদেন হিস্ট্রি (Payments)
          </h1>
          <p className="text-xs text-slate-400">ক্যাশ ও মোবাইল ব্যাংকিং (bKash / Nagad / Rocket) ট্রানজেকশন ট্র্যাকিং</p>
        </div>

        <button
          onClick={() => {
            if (packages.length > 0 && !packageId) setPackageId(packages[0].id);
            setIsRecordOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>পেমেন্ট এন্ট্রি করুন</span>
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
            placeholder="ইউজারনেম, ট্রানজেকশন ID বা ফোন..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 transition"
          >
            <option value="ALL">সব পেমেন্ট মেথড</option>
            <option value="CASH">ক্যাশ (Cash)</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
            <option value="ROCKET">Rocket</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">গ্রাহক / ইউজার</th>
                <th className="py-3 px-4">প্যাকেজ</th>
                <th className="py-3 px-4">পরিমাণ (BDT)</th>
                <th className="py-3 px-4">মেথড</th>
                <th className="py-3 px-4">ট্রানজেকশন ID / ফোন</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    কোন পেমেন্ট রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                      {p.username || 'Anonymous'}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-300">
                      {p.packageName || 'Direct Cash'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-brand-400 font-display text-sm">
                      ৳ {p.amount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-[11px] font-bold text-slate-200">
                        {p.method}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div>{p.transactionId || '—'}</div>
                      <div className="text-[10px] text-slate-500">{p.senderPhone || ''}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          p.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => verifyPaymentMutation.mutate(p.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition ml-auto flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>অনুমোদন করুন</span>
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

      {/* Record Payment Modal */}
      {isRecordOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-brand-400" />
                পেমেন্ট রেকর্ড করুন
              </h2>
              <button onClick={() => setIsRecordOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">গ্রাহকের ইউজারনেম (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. tanvir_ahmed"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">প্যাকেজ</label>
                  <select
                    value={packageId}
                    onChange={(e) => {
                      setPackageId(e.target.value);
                      const found = packages.find(p => p.id === e.target.value);
                      if (found) setAmount(found.price);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  >
                    {packages.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (৳{p.price})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">পরিমাণ (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">পেমেন্ট মেথড *</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="CASH">ক্যাশ (Cash)</option>
                  <option value="BKASH">বিকাশ (bKash)</option>
                  <option value="NAGAD">নগদ (Nagad)</option>
                  <option value="ROCKET">রকেট (Rocket)</option>
                </select>
              </div>

              {method !== 'CASH' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">ট্রানজেকশন ID</label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. BK8910234"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">প্রেরকের মোবাইল</label>
                    <input
                      type="text"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      placeholder="017xxxxxxxx"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={recordPaymentMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  পেমেন্ট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

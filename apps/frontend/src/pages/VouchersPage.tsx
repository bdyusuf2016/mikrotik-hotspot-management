import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import { PrintableVouchers } from '../components/PrintableVouchers.js';
import QRCode from 'qrcode';
import type { HotspotVoucher, HotspotPackage } from '@hotspot/shared';
import {
  Ticket,
  Plus,
  Printer,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Copy,
  Check,
  QrCode,
  Download,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export const VouchersPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [packageFilter, setPackageFilter] = useState<string>('ALL');
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedVoucherForQr, setSelectedVoucherForQr] = useState<HotspotVoucher | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [voucherToDelete, setVoucherToDelete] = useState<HotspotVoucher | null>(null);
  const [isClearAllConfirmOpen, setIsClearAllConfirmOpen] = useState(false);

  // Generator form
  const [packageId, setPackageId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [prefix, setPrefix] = useState('HS-');
  const [codeLength, setCodeLength] = useState(6);

  const { data: vouchers = [], isLoading } = useQuery<HotspotVoucher[]>({
    queryKey: ['vouchers'],
    queryFn: () => apiRequest<HotspotVoucher[]>('/vouchers')
  });

  const { data: packages = [] } = useQuery<HotspotPackage[]>({
    queryKey: ['packages'],
    queryFn: () => apiRequest<HotspotPackage[]>('/packages')
  });

  const generateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiRequest<HotspotVoucher[]>('/vouchers/generate', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsGenerateModalOpen(false);
    }
  });

  const disableMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/vouchers/${id}/disable`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/vouchers/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setVoucherToDelete(null);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () =>
      apiRequest('/vouchers/all', { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vouchers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsClearAllConfirmOpen(false);
    }
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      packageId: packageId || packages[0]?.id,
      quantity: Number(quantity),
      prefix,
      codeLength: Number(codeLength),
      includePassword: true
    });
  };

  const openQrModal = async (v: HotspotVoucher) => {
    setSelectedVoucherForQr(v);
    const loginUrl = `http://10.20.20.1/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(v.password || v.code)}`;
    const dataUrl = await QRCode.toDataURL(loginUrl, { margin: 1, width: 220 });
    setQrDataUrl(dataUrl);
    setIsQrModalOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCsv = () => {
    const headers = ['Voucher Code', 'Password', 'Package', 'Price (BDT)', 'Status', 'Created At', 'Batch ID'];
    const rows = filteredVouchers.map(v => [
      v.code,
      v.password || '',
      `"${v.package?.name || ''}"`,
      v.package?.price || 0,
      v.status,
      v.createdAt,
      v.batchId || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vouchers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredVouchers = vouchers.filter((v) => {
    const matchesSearch =
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.batchId && v.batchId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    const matchesPackage = packageFilter === 'ALL' || v.packageId === packageFilter;
    return matchesSearch && matchesStatus && matchesPackage;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-brand-400" />
            {t.nav_vouchers}
          </h1>
          <p className="text-xs text-slate-400">
            প্রিপেইড ভাউচার জেনারেট, ব্যাচ প্রিন্ট ও কিউআর কোড ব্যবস্থাপনা
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {vouchers.length > 0 && (
            <button
              onClick={() => setIsClearAllConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 rounded-xl text-xs font-semibold text-red-300 transition"
              title="সকল ভাউচার ডেটাবেজ ও রাউটার থেকে মুছুন"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>সকল ভাউচার মুছুন</span>
            </button>
          )}
          <button
            onClick={downloadCsv}
            disabled={filteredVouchers.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>এক্সপোর্ট (CSV)</span>
          </button>
          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={filteredVouchers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>প্রিন্ট প্রিভিউ</span>
          </button>
          <button
            onClick={() => {
              if (packages.length > 0 && !packageId) setPackageId(packages[0].id);
              setIsGenerateModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ভাউচার জেনারেট</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ভাউচার কোড বা ব্যাচ আইডি..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">সকল স্ট্যাটাস</option>
            <option value="UNUSED">UNUSED (অব্যবহৃত)</option>
            <option value="ACTIVATED">ACTIVATED (ব্যবহৃত)</option>
            <option value="DISABLED">DISABLED (বাতিল)</option>
          </select>
        </div>

        <div>
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="ALL">সকল প্যাকেজ</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} (৳ {pkg.price})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Vouchers Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">ভাউচার কোড</th>
                <th className="py-3 px-4">পাসওয়ার্ড (PIN)</th>
                <th className="py-3 px-4">প্যাকেজ</th>
                <th className="py-3 px-4">মূল্য</th>
                <th className="py-3 px-4">ব্যাচ আইডি</th>
                <th className="py-3 px-4">স্ট্যাটাস</th>
                <th className="py-3 px-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    কোনো ভাউচার পাওয়া যায়নি
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-300">
                      <div className="flex items-center gap-2">
                        <span>{v.code}</span>
                        <button
                          onClick={() => copyToClipboard(v.code)}
                          className="text-slate-500 hover:text-slate-300 transition"
                          title="Copy code"
                        >
                          {copiedCode === v.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200">
                      {v.password || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200">
                      {v.package?.name || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-amber-400">
                      ৳ {v.package?.price || 0}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {v.batchId || '—'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          v.status === 'UNUSED'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : v.status === 'ACTIVATED'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openQrModal(v)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg text-xs transition"
                          title="Show QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {v.status === 'UNUSED' && (
                          <button
                            onClick={() => disableMutation.mutate(v.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs transition"
                            title="Disable voucher"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setVoucherToDelete(v)}
                          className="p-1.5 bg-slate-800 hover:bg-red-950 text-red-400 rounded-lg text-xs transition"
                          title="Delete voucher from Router & Database"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {voucherToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-sm font-bold text-slate-100">ভাউচার মুছে ফেলার নিশ্চয়তা</h2>
            </div>
            <p className="text-xs text-slate-300">
              আপনি কি নিশ্চিতভাবে ভাউচার <strong>{voucherToDelete.code}</strong> মুছে ফেলতে চান? এটি আপনার রাউটার ও ডেটাবেজ উভয় স্থান থেকে চিরতরে মুছে যাবে।
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setVoucherToDelete(null)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                {t.btn_cancel}
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(voucherToDelete.id)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {isClearAllConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-900/60 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-sm font-bold text-slate-100">সকল ভাউচার মুছবেন?</h2>
            </div>
            <p className="text-xs text-slate-300">
              আপনি কি সকল ভাউচার ({vouchers.length} টি) ডেটাবেজ এবং MikroTik রাউটার থেকে একবারে মুছে ফেলতে চান?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearAllConfirmOpen(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                {t.btn_cancel}
              </button>
              <button
                type="button"
                disabled={clearAllMutation.isPending}
                onClick={() => clearAllMutation.mutate()}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
              >
                {clearAllMutation.isPending ? 'মুছে ফেলা হচ্ছে...' : 'সব মুছে ফেলুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-brand-400" />
                ভাউচার জেনারেটর
              </h2>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্যাকেজ নির্বাচন করুন *</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ৳ {pkg.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ভাউচার সংখ্যা (Quantity) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={100}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">কোডের দৈর্ঘ্য (Digits)</label>
                  <input
                    type="number"
                    required
                    min={4}
                    max={10}
                    value={codeLength}
                    onChange={(e) => setCodeLength(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্রিফিক্স (Prefix)</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. HS-"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {generateMutation.isPending ? 'তৈরি হচ্ছে...' : 'জেনারেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single QR Code Modal */}
      {isQrModalOpen && selectedVoucherForQr && qrDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100">ভাউচার কিউআর কোড</h2>
              <button onClick={() => setIsQrModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-3 rounded-xl inline-block shadow-inner mx-auto">
              <img src={qrDataUrl} alt="Voucher QR" className="w-48 h-48 mx-auto" />
            </div>

            <div className="space-y-1 font-mono">
              <div className="text-xs text-slate-400">ভাউচার কোড:</div>
              <div className="text-base font-extrabold text-brand-300">{selectedVoucherForQr.code}</div>
              <div className="text-xs text-slate-400 mt-1">পাসওয়ার্ড: <span className="text-white font-bold">{selectedVoucherForQr.password}</span></div>
              <div className="text-xs text-amber-400 font-semibold">{selectedVoucherForQr.package?.name}</div>
            </div>

            <p className="text-[11px] text-slate-400">
              মোবাইলের ক্যামেরা দিয়ে স্ক্যান করলে সরাসরি হটস্পটে অটো-লগইন হবে।
            </p>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* Printable Vouchers Modal */}
      {isPrintModalOpen && (
        <PrintableVouchers
          vouchers={filteredVouchers}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

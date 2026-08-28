import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { HotspotPackage } from '@hotspot/shared';
import {
  Layers,
  Plus,
  Clock,
  Zap,
  Users,
  ShieldCheck,
  Trash2,
  Edit2,
  RefreshCw,
  Cpu,
  CheckCircle,
  X
} from 'lucide-react';

interface SpeedProfileItem {
  name: string;
  rateLimit: string;
  downloadMbps: number;
  uploadMbps: number;
  sharedUsers: number;
  sessionTimeout: string;
  idleTimeout: string;
}

export const PackagesPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'PACKAGES' | 'PROFILES'>('PACKAGES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<HotspotPackage | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(1440);
  const [downloadMbps, setDownloadMbps] = useState(5);
  const [uploadMbps, setUploadMbps] = useState(2);
  const [sharedUsers, setSharedUsers] = useState(1);

  const { data: packages = [] } = useQuery<HotspotPackage[]>({
    queryKey: ['packages'],
    queryFn: () => apiRequest<HotspotPackage[]>('/packages')
  });

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<SpeedProfileItem[]>({
    queryKey: ['speed-profiles'],
    queryFn: () => apiRequest<SpeedProfileItem[]>('/packages/profiles')
  });

  const createPackageMutation = useMutation({
    mutationFn: (newPkg: Record<string, unknown>) =>
      apiRequest('/packages', { method: 'POST', body: JSON.stringify(newPkg) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsModalOpen(false);
      setName('');
    }
  });

  const updatePackageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
      setIsEditOpen(false);
    }
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/packages/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['packages'] });
    }
  });

  const syncProfilesMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ syncedCount: number }>('/packages/profiles/sync', { method: 'POST' }),
    onSuccess: (data) => {
      setSyncSuccessMsg(`সফল! ${data.syncedCount} টি স্ট্যান্ডার্ড স্পিড প্রোফাইল MikroTik RouterOS-এ সিঙ্ক হয়েছে।`);
      setTimeout(() => setSyncSuccessMsg(null), 5000);
    }
  });

  const handleCreatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    createPackageMutation.mutate({
      name,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      downloadMbps: Number(downloadMbps),
      uploadMbps: Number(uploadMbps),
      sharedUsers: Number(sharedUsers),
      validityMode: 'FROM_FIRST_LOGIN'
    });
  };

  const openEditModal = (pkg: HotspotPackage) => {
    setSelectedPkg(pkg);
    setName(pkg.name);
    setPrice(pkg.price);
    setDurationMinutes(pkg.durationMinutes);
    setDownloadMbps(pkg.downloadMbps);
    setUploadMbps(pkg.uploadMbps);
    setSharedUsers(pkg.sharedUsers);
    setIsEditOpen(true);
  };

  const handleUpdatePackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg) return;
    updatePackageMutation.mutate({
      id: selectedPkg.id,
      data: {
        name,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        downloadMbps: Number(downloadMbps),
        uploadMbps: Number(uploadMbps),
        sharedUsers: Number(sharedUsers)
      }
    });
  };

  const applyPreset = (pName: string, pMin: number, pPrice: number, pDl: number, pUl: number) => {
    setName(pName);
    setDurationMinutes(pMin);
    setPrice(pPrice);
    setDownloadMbps(pDl);
    setUploadMbps(pUl);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-brand-400" />
            {t.nav_packages}
          </h1>
          <p className="text-xs text-slate-400">ওয়াইফাই বিলিং প্যাকেজ এবং MikroTik ব্যান্ডউইথ রেট লিমিট কনফিগারেশন</p>
        </div>

        {/* Tab Controls & Add button */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('PACKAGES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeTab === 'PACKAGES' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              বিলিং প্যাকেজ ({packages.length})
            </button>
            <button
              onClick={() => setActiveTab('PROFILES')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'PROFILES' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>স্পিড প্রোফাইল ({profiles.length})</span>
            </button>
          </div>

          {activeTab === 'PACKAGES' && (
            <button
              onClick={() => {
                setName('');
                setPrice(50);
                setDurationMinutes(1440);
                setDownloadMbps(5);
                setUploadMbps(2);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>নতুন প্যাকেজ</span>
            </button>
          )}

          {activeTab === 'PROFILES' && (
            <button
              onClick={() => syncProfilesMutation.mutate()}
              disabled={syncProfilesMutation.isPending}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncProfilesMutation.isPending ? 'animate-spin' : ''}`} />
              <span>MikroTik-এ সিঙ্ক করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{syncSuccessMsg}</span>
          </div>
          <button onClick={() => setSyncSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tab 1: Billing Packages Grid */}
      {activeTab === 'PACKAGES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <span className="text-sm font-bold text-slate-100">{pkg.name}</span>
                  <span className="text-base font-black text-brand-400 font-display">৳ {pkg.price}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      মেয়াদ (Duration):
                    </span>
                    <span className="font-semibold">
                      {pkg.durationMinutes >= 1440
                        ? `${Math.round(pkg.durationMinutes / 1440)} দিন`
                        : `${Math.round(pkg.durationMinutes / 60)} ঘণ্টা`}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      স্পিড লিমিট:
                    </span>
                    <span className="font-mono font-bold text-amber-400">{pkg.downloadMbps}M / {pkg.uploadMbps}M</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      শেয়ার্ড ইউজার:
                    </span>
                    <span className="font-semibold">{pkg.sharedUsers} ডিভাইস</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      ভ্যালিডিটি মোড:
                    </span>
                    <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-indigo-300 font-mono">
                      {pkg.validityMode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(pkg)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg text-xs transition"
                  title="Edit Package"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete package ${pkg.name}?`)) {
                      deletePackageMutation.mutate(pkg.id);
                    }
                  }}
                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs transition"
                  title="Delete Package"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: RouterOS Speed Profiles */}
      {activeTab === 'PROFILES' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-brand-400">MikroTik RouterOS 7 ব্যান্ডউইথ প্রোফাইল:</span> নিচের স্ট্যান্ডার্ড প্রোফাইলগুলো সরাসরি রাউটারের <code className="text-brand-300">/ip/hotspot/user/profile</code> তালিকায় সংরক্ষিত হয় এবং গ্রাহকের কিউ (Queue Simple) নিয়ন্ত্রণ করে।
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">প্রোফাইলের নাম</th>
                  <th className="py-3 px-4">রেট লিমিট (Rate-Limit)</th>
                  <th className="py-3 px-4">ডাউনলোড</th>
                  <th className="py-3 px-4">আপলোড</th>
                  <th className="py-3 px-4">শেয়ার্ড ইউজার</th>
                  <th className="py-3 px-4">Session Timeout</th>
                  <th className="py-3 px-4">Idle Timeout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                {profiles.map((p) => (
                  <tr key={p.name} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4 font-bold text-brand-400">{p.name}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-100">{p.rateLimit}</td>
                    <td className="py-3.5 px-4 text-sky-400">{p.downloadMbps} Mbps</td>
                    <td className="py-3.5 px-4 text-emerald-400">{p.uploadMbps} Mbps</td>
                    <td className="py-3.5 px-4 text-slate-300">{p.sharedUsers}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.sessionTimeout}</td>
                    <td className="py-3.5 px-4 text-slate-400">{p.idleTimeout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Package Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                নতুন প্যাকেজ তৈরি করুন
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-semibold">কুইক প্রিসেট বাছাই করুন:</div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('1 Day Pass', 1440, 50, 5, 2)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-200"
                >
                  ১ দিন (৳৫০)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('7 Days Weekly Pro', 10080, 250, 8, 3)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-200"
                >
                  ৭ দিন (৳২৫০)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('30 Days Monthly VIP', 43200, 800, 10, 5)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-200"
                >
                  ৩০ দিন (৳৮০০)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreatePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্যাকেজের নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 15 Days Student Pass"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">মূল্য (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">মেয়াদ (মিনিট) *</label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ডাউনলোড স্পিড (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={downloadMbps}
                    onChange={(e) => setDownloadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">আপলোড স্পিড (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={uploadMbps}
                    onChange={(e) => setUploadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">শেয়ার্ড ইউজার (ডিভাইস সংখ্যা)</label>
                <input
                  type="number"
                  value={sharedUsers}
                  onChange={(e) => setSharedUsers(Number(e.target.value))}
                  min={1}
                  max={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={createPackageMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  প্যাকেজ সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Package Modal */}
      {isEditOpen && selectedPkg && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-400" />
                প্যাকেজ এডিট ({selectedPkg.name})
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePackage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্যাকেজের নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">মূল্য (BDT) *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">মেয়াদ (মিনিট) *</label>
                  <input
                    type="number"
                    required
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ডাউনলোড স্পিড (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={downloadMbps}
                    onChange={(e) => setDownloadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">আপলোড স্পিড (Mbps) *</label>
                  <input
                    type="number"
                    required
                    value={uploadMbps}
                    onChange={(e) => setUploadMbps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={updatePackageMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  আপডেট সেভ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

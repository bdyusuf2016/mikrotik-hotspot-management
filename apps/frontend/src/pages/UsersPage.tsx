import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import { useLocaleStore } from '../stores/localeStore.js';
import type { HotspotUser, HotspotPackage } from '@hotspot/shared';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  PowerOff,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Key,
  Ban,
  Edit2,
  Eye,
  X,
  Copy,
  Check,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { t } = useLocaleStore();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetPassOpen, setIsResetPassOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<HotspotUser | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [packageId, setPackageId] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const { data: users = [], isLoading } = useQuery<HotspotUser[]>({
    queryKey: ['hotspot-users'],
    queryFn: () => apiRequest<HotspotUser[]>('/users')
  });

  const { data: packages = [] } = useQuery<HotspotPackage[]>({
    queryKey: ['packages'],
    queryFn: () => apiRequest<HotspotPackage[]>('/packages')
  });

  const createUserMutation = useMutation({
    mutationFn: (newUser: Record<string, unknown>) =>
      apiRequest('/users', { method: 'POST', body: JSON.stringify(newUser) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsCreateOpen(false);
      resetForm();
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setIsEditOpen(false);
    }
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password?: string }) =>
      apiRequest<{ password: string; message: string }>(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password })
      }),
    onSuccess: (data) => {
      setResetSuccessMessage(data.password);
    }
  });

  const blockUserMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      apiRequest(`/users/${id}/block`, { method: 'POST', body: JSON.stringify({ reason }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const unblockUserMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/users/${id}/unblock`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const disconnectMutation = useMutation({
    mutationFn: (user: string) =>
      apiRequest(`/users/${user}/disconnect`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setFullName('');
    setPhone('');
    setPackageId(packages[0]?.id || '');
    setMacAddress('');
    setNotes('');
  };

  const openCreateModal = () => {
    resetForm();
    if (packages.length > 0 && !packageId) {
      setPackageId(packages[0].id);
    }
    setIsCreateOpen(true);
  };

  const openEditModal = (u: HotspotUser) => {
    setSelectedUser(u);
    setFullName(u.fullName || '');
    setPhone(u.phone || '');
    setPackageId(u.packageId || packages[0]?.id || '');
    setMacAddress(u.macAddress || '');
    setNotes(u.notes || '');
    setIsEditOpen(true);
  };

  const openResetPassModal = (u: HotspotUser) => {
    setSelectedUser(u);
    setNewPassword(Math.random().toString(36).slice(-8));
    setResetSuccessMessage(null);
    setIsResetPassOpen(true);
  };

  const openDetailModal = (u: HotspotUser) => {
    setSelectedUser(u);
    setIsDetailOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const effectivePkgId = packageId || packages[0]?.id || 'pkg-1d';
    createUserMutation.mutate({
      username: username.trim(),
      password: password.trim(),
      fullName: fullName.trim() || undefined,
      phone: phone.trim() || undefined,
      packageId: effectivePkgId,
      macAddress: macAddress.trim() || undefined,
      notes: notes.trim() || undefined
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: {
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        packageId: packageId || undefined,
        macAddress: macAddress.trim() || undefined,
        notes: notes.trim() || undefined
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.fullName && u.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm)) ||
      (u.macAddress && u.macAddress.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            সক্রিয়
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            মেয়াদোত্তীর্ণ
          </span>
        );
      case 'BLOCKED':
      case 'DISABLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle className="w-3 h-3" />
            নিষিদ্ধ / ব্লকড
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5 font-display">
            <Users className="w-6 h-6 text-brand-400" />
            হটস্পট গ্রাহক ব্যবস্থাপনা
          </h1>
          <p className="text-xs text-slate-400 mt-1">সক্রিয়, মেয়াদোত্তীর্ণ ও ব্লকড হটস্পট অ্যাকাউন্ট নিয়ন্ত্রণ করুন</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['hotspot-users'] })}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl font-semibold transition text-xs md:text-sm disabled:opacity-40"
            title="MikroTik Router থেকে গ্রাহক তালিকা রিফ্রেশ ও সিঙ্ক করুন"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-brand-400' : 'text-brand-400'}`} />
            <span>রাউটার সিঙ্ক</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.btn_add_user}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ইউজারনেম, নাম, ফোন বা ম্যাক দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs md:text-sm text-slate-200 focus:outline-none focus:border-brand-500 transition"
          >
            <option value="ALL">সকল অবস্থা (All Status)</option>
            <option value="ACTIVE">সক্রিয় (Active)</option>
            <option value="EXPIRED">মেয়াদোত্তীর্ণ (Expired)</option>
            <option value="BLOCKED">ব্লকড (Blocked)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">গ্রাহকের বিবরণ</th>
                <th className="px-4 py-3.5">প্যাকেজ ও স্পিড</th>
                <th className="px-4 py-3.5">IP / MAC</th>
                <th className="px-4 py-3.5">মেয়াদ ও স্ট্যাটাস</th>
                <th className="px-4 py-3.5 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    গ্রাহক তালিকা লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    কোন হটস্পট গ্রাহক পাওয়া যায়নি। "নতুন গ্রাহক যুক্ত করুন" চাপুন।
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-brand-400" />
                        {user.username}
                      </div>
                      <div className="text-xs text-slate-400">{user.fullName || user.phone || 'নাম দেওয়া হয়নি'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-200">{user.packageName || 'কাস্টম প্যাকেজ'}</span>
                      <div className="text-xs text-brand-400 font-mono">{user.profileName}</div>
                    </td>

                    <td className="px-4 py-3.5 font-mono text-xs">
                      <div className="text-slate-300">{user.ipAddress || 'Dynamic IP'}</div>
                      <div className="text-slate-500">{user.macAddress || 'No Bind'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="mb-1">{getStatusBadge(user.status)}</div>
                      <div className="text-[10px] text-slate-400">
                        {user.expiresAt ? `মেয়াদ: ${new Date(user.expiresAt).toLocaleDateString()}` : 'মেয়াদহীন'}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openDetailModal(user)}
                          title="View user details"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          title="Edit user profile"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-brand-400 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openResetPassModal(user)}
                          title="Reset user password"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => disconnectMutation.mutate(user.username)}
                          title="Disconnect active session"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                        {user.status === 'BLOCKED' ? (
                          <button
                            onClick={() => unblockUserMutation.mutate(user.id)}
                            title="Unblock user"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to block/ban ${user.username}?`)) {
                                blockUserMutation.mutate({ id: user.id, reason: 'Admin Ban Action' });
                              }
                            }}
                            title="Block / Ban user"
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to permanently delete ${user.username}?`)) {
                              deleteMutation.mutate(user.id);
                            }
                          }}
                          title="Delete user"
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
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

      {/* Create User Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-brand-400" />
                {t.btn_add_user}
              </h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createUserMutation.isError && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{(createUserMutation.error as Error).message}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">ইউজারনেম (Username) *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. shuvo_rahman"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">পাসওয়ার্ড (Password) *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">পুরো নাম (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="নাম"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">ফোন নাম্বার (ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">হটস্পট প্যাকেজ *</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ৳ {pkg.price} ({pkg.downloadMbps} Mbps)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">MAC এড্রেস বাইন্ডিং (ঐচ্ছিক)</label>
                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                >
                  {t.btn_cancel}
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {createUserMutation.isPending ? 'তৈরি হচ্ছে...' : 'ইউজার তৈরি করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-brand-400" />
                গ্রাহক তথ্য সম্পাদন ({selectedUser.username})
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {updateUserMutation.isError && (
              <div className="p-3 rounded-xl bg-red-500/20 text-red-300 border border-red-500/30 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{(updateUserMutation.error as Error).message}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">পুরো নাম</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">ফোন নাম্বার</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">প্যাকেজ পরিবর্তন</label>
                <select
                  value={packageId}
                  onChange={(e) => setPackageId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                >
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} — ৳ {pkg.price} ({pkg.downloadMbps} Mbps)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">MAC এড্রেস</label>
                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                />
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
                  disabled={updateUserMutation.isPending}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                >
                  {updateUserMutation.isPending ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {isResetPassOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-400" />
                পাসওয়ার্ড রিসেট ({selectedUser.username})
              </h2>
              <button onClick={() => setIsResetPassOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center space-y-2">
                  <CheckCircle className="w-8 h-8 mx-auto" />
                  <p className="font-bold text-sm">পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে!</p>
                  <div className="flex items-center justify-center gap-2 bg-slate-950 p-2.5 rounded-lg font-mono text-base font-bold text-white border border-slate-800">
                    <span>{resetSuccessMessage}</span>
                    <button
                      onClick={() => copyToClipboard(resetSuccessMessage)}
                      className="p-1 text-slate-400 hover:text-white"
                      title="Copy"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setIsResetPassOpen(false)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-xs"
                >
                  বন্ধ করুন
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">নতুন পাসওয়ার্ড</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsResetPassOpen(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition"
                  >
                    {t.btn_cancel}
                  </button>
                  <button
                    type="button"
                    disabled={resetPasswordMutation.isPending}
                    onClick={() => resetPasswordMutation.mutate({ id: selectedUser.id, password: newPassword })}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold transition disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড সেট করুন'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {isDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-400" />
                গ্রাহক প্রোফাইল বিবরণ
              </h2>
              <button onClick={() => setIsDetailOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">ইউজারনেম</span>
                <span className="font-bold text-white font-mono">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">নাম</span>
                <span className="font-medium text-slate-200">{selectedUser.fullName || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">ফোন</span>
                <span className="font-medium text-slate-200">{selectedUser.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">প্যাকেজ</span>
                <span className="font-semibold text-brand-400">{selectedUser.packageName || 'কাস্টম'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">স্পিড প্রোফাইল</span>
                <span className="font-mono text-slate-200">{selectedUser.profileName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">MAC Address</span>
                <span className="font-mono text-slate-300">{selectedUser.macAddress || 'আনবাউন্ড'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">স্ট্যাটাস</span>
                <span>{getStatusBadge(selectedUser.status)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">তৈরি হয়েছে</span>
                <span className="text-slate-300">{new Date(selectedUser.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition text-xs"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

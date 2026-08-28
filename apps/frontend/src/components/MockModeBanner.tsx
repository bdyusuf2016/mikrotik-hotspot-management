import React, { useState } from 'react';
import { Radio, ShieldCheck, CheckCircle2, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client.js';
import type { RouterStatus } from '@hotspot/shared';

export const MockModeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  const { data: status } = useQuery<RouterStatus>({
    queryKey: ['router-status-banner'],
    queryFn: () => apiRequest<RouterStatus>('/mikrotik/status'),
    refetchInterval: 30000
  });

  if (dismissed) return null;

  const isLiveConnected = status?.isReachable && status?.apiConnected;

  return (
    <div
      className={`px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between no-print transition ${
        isLiveConnected
          ? 'bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-200'
          : 'bg-amber-500/15 border-b border-amber-500/30 text-amber-200'
      }`}
    >
      <div className="flex items-center gap-2 max-w-4xl">
        {isLiveConnected ? (
          <>
            <Radio className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span>
              🟢 <b>লাইভ MikroTik রাউটার সংযুক্ত:</b> 10.10.13.38 — RouterOS 7.24.1 ({status?.model || 'RB951Ui-2HnD'}) এর সাথে সরাসরি যুক্ত।
            </span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              🔒 <b>সরাসরি মোড সক্রিয়:</b> আপনার আসল রাউটার (10.10.13.38) সুরক্ষিত ও নিরাপদ রয়েছে।
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border ${
            isLiveConnected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{isLiveConnected ? 'Live Router Connected' : 'VPN Bridge Mode'}</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-slate-400 hover:text-white rounded transition"
          title="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

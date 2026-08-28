import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import type { HotspotVoucher } from '@hotspot/shared';
import { Printer, X, LayoutGrid, FileText, Receipt } from 'lucide-react';

interface PrintableVouchersProps {
  vouchers: HotspotVoucher[];
  businessName?: string;
  supportPhone?: string;
  onClose: () => void;
}

type PrintLayout = 'A4' | 'A5' | 'THERMAL';

export const PrintableVouchers: React.FC<PrintableVouchersProps> = ({
  vouchers,
  businessName = 'SuperNet HotSpot',
  supportPhone = '+880 1700-000000',
  onClose
}) => {
  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [layout, setLayout] = useState<PrintLayout>('A4');

  useEffect(() => {
    async function generateQrs() {
      const map: Record<string, string> = {};
      for (const v of vouchers) {
        try {
          const qrUrl = `http://10.20.20.1/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(v.password || v.code)}`;
          map[v.id] = await QRCode.toDataURL(qrUrl, { margin: 1, width: 100 });
        } catch {
          // Ignore QR error
        }
      }
      setQrMap(map);
    }
    generateQrs();
  }, [vouchers]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Control bar */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 no-print text-white">
        <div>
          <h2 className="text-base font-bold">প্রিন্ট ভাউচার শিট (Print Preview)</h2>
          <p className="text-xs text-slate-400">মোট {vouchers.length} টি ভাউচার প্রিন্টের জন্য প্রস্তুত</p>
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setLayout('A4')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition ${
              layout === 'A4' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>A4 Sheet</span>
          </button>
          <button
            onClick={() => setLayout('A5')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition ${
              layout === 'A5' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>A5 Sheet</span>
          </button>
          <button
            onClick={() => setLayout('THERMAL')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition ${
              layout === 'THERMAL' ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Thermal POS (58/80mm)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-lg text-xs font-bold transition shadow-lg shadow-brand-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন (Print)</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div
        id="printable-voucher-sheet"
        className={`w-full bg-white text-slate-900 p-6 rounded-xl shadow-2xl ${
          layout === 'THERMAL'
            ? 'max-w-xs space-y-4'
            : layout === 'A5'
            ? 'max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4'
            : 'max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'
        }`}
      >
        {vouchers.map((v) => (
          <div
            key={v.id}
            className="border-2 border-dashed border-slate-400 p-3.5 rounded-xl flex flex-col justify-between bg-slate-50 relative page-break-inside-avoid"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2">
                <span className="font-bold text-xs text-brand-700 uppercase tracking-wider">{businessName}</span>
                <span className="text-[11px] font-bold bg-brand-100 text-brand-800 px-2 py-0.5 rounded">
                  ৳ {v.package?.price || 30}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                {qrMap[v.id] && (
                  <img src={qrMap[v.id]} alt="QR Code" className="w-16 h-16 border rounded bg-white p-0.5 shrink-0" />
                )}
                <div className="text-xs space-y-0.5">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">প্যাকেজ:</div>
                  <div className="font-bold text-slate-800 leading-tight">{v.package?.name || '1 Day Unlimited'}</div>
                  <div className="text-[11px] text-slate-600 font-mono">স্পিড: {v.package?.downloadMbps || 5} Mbps</div>
                </div>
              </div>

              <div className="bg-slate-200/90 p-2 rounded-lg text-center space-y-0.5 mb-2">
                <div className="text-[9px] text-slate-600 uppercase font-bold tracking-wider">ভাউচার কোড (Code)</div>
                <div className="font-mono text-base font-black text-slate-900 tracking-widest select-all">{v.code}</div>
                {v.password && v.password !== v.code && (
                  <div className="text-[10px] text-slate-700 font-mono">পাসওয়ার্ড: <span className="font-bold">{v.password}</span></div>
                )}
              </div>
            </div>

            <div className="text-[9px] text-slate-500 text-center border-t border-slate-200 pt-1">
              লগইন: <b>10.20.20.1</b> | হেল্পলাইন: {supportPhone}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

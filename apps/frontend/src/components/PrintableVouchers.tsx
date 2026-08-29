import React, { useEffect, useState, useMemo } from 'react';
import QRCode from 'qrcode';
import type { HotspotVoucher } from '@hotspot/shared';
import { VoucherShareModal } from './VoucherShareModal.js';
import { downloadVouchersHtmlFile } from '../utils/htmlExporter.js';
import {
  Printer,
  X,
  LayoutGrid,
  FileText,
  Receipt,
  Settings2,
  Sliders,
  Scissors,
  Eye,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  CreditCard,
  Palette,
  Phone,
  Globe,
  Tag,
  Shield,
  Clock,
  Wifi,
  KeyRound,
  RotateCcw,
  Share2,
  ListChecks,
  HelpCircle,
  FileCode
} from 'lucide-react';

interface PrintableVouchersProps {
  vouchers: HotspotVoucher[];
  businessName?: string;
  supportPhone?: string;
  hotspotAddress?: string;
  onClose: () => void;
}

export type PaperSize = 'A4' | 'A5' | 'LETTER' | 'THERMAL_80' | 'THERMAL_58' | 'CR80';
export type PageOrientation = 'portrait' | 'landscape';
export type CardTheme = 'modern' | 'gradient' | 'dashed' | 'badge' | 'thermal' | 'minimal';
export type CardScale = 'compact' | 'standard' | 'large';
export type MarginSize = 'none' | 'compact' | 'normal' | 'spacious';

export const PrintableVouchers: React.FC<PrintableVouchersProps> = ({
  vouchers: initialVouchers,
  businessName: defaultBusinessName = 'Yusuf Computer & IT',
  supportPhone: defaultPhone = '01933814200',
  hotspotAddress: defaultHotspotAddress = '10.20.20.1',
  onClose
}) => {
  // Layout and Page Settings
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [columns, setColumns] = useState<number>(3);
  const [cardTheme, setCardTheme] = useState<CardTheme>('modern');
  const [cardScale, setCardScale] = useState<CardScale>('standard');
  const [marginSize, setMarginSize] = useState<MarginSize>('compact');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Custom Header & Branding Content
  const [businessName, setBusinessName] = useState<string>(defaultBusinessName);
  const [tagline, setTagline] = useState<string>('হাই-স্পিড ওয়াইফাই হটস্পট');
  const [supportPhone, setSupportPhone] = useState<string>(defaultPhone);
  const [hotspotAddress, setHotspotAddress] = useState<string>(defaultHotspotAddress);
  const [instructionStyle, setInstructionStyle] = useState<'detailed' | 'compact' | 'none'>('detailed');
  const [footerNote, setFooterNote] = useState<string>('১. Wi-Fi এ কানেক্ট করুন  ২. কোড/পিন দিন বা QR স্ক্যান করুন  ৩. Login চাপুন');
  const [shareTargetVoucher, setShareTargetVoucher] = useState<HotspotVoucher | null>(null);

  // Field Visibility Toggles
  const [credentialLayout, setCredentialLayout] = useState<'user_pass' | 'pin_only' | 'combined'>('combined');
  const [showQrCode, setShowQrCode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(true);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showPackageName, setShowPackageName] = useState<boolean>(true);
  const [showSpeed, setShowSpeed] = useState<boolean>(true);
  const [showBatchId, setShowBatchId] = useState<boolean>(false);
  const [showPhone, setShowPhone] = useState<boolean>(true);
  const [showLoginIp, setShowLoginIp] = useState<boolean>(true);
  const [showCutMarks, setShowCutMarks] = useState<boolean>(true);
  const [showFooterNote, setShowFooterNote] = useState<boolean>(true);
  const [colorMode, setColorMode] = useState<'color' | 'mono'>('color');

  // QR Code Cache
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  // Auto-adjust default columns when paper size changes
  useEffect(() => {
    if (paperSize === 'THERMAL_80' || paperSize === 'THERMAL_58') {
      setColumns(1);
      setOrientation('portrait');
    } else if (paperSize === 'A5') {
      setColumns(2);
    } else if (paperSize === 'CR80') {
      setColumns(2);
    } else if (paperSize === 'A4') {
      setColumns(orientation === 'landscape' ? 4 : 3);
    }
  }, [paperSize, orientation]);

  // Generate QR codes for all vouchers
  useEffect(() => {
    let isMounted = true;
    async function generateQrs() {
      const map: Record<string, string> = {};
      for (const v of initialVouchers) {
        try {
          const loginHost = hotspotAddress.trim() || '10.20.20.1';
          const qrUrl = `http://${loginHost}/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(v.password || v.code)}`;
          map[v.id] = await QRCode.toDataURL(qrUrl, {
            margin: 1,
            width: 140,
            color: {
              dark: colorMode === 'mono' ? '#000000' : '#1e293b',
              light: '#ffffff'
            }
          });
        } catch {
          // Ignore QR generation errors
        }
      }
      if (isMounted) setQrMap(map);
    }
    generateQrs();
    return () => {
      isMounted = false;
    };
  }, [initialVouchers, hotspotAddress, colorMode]);

  // Calculate dynamic @page CSS rule
  const pageCss = useMemo(() => {
    let sizeParam = 'A4 portrait';
    let marginParam = '6mm';

    if (paperSize === 'A4') sizeParam = `A4 ${orientation}`;
    else if (paperSize === 'A5') sizeParam = `A5 ${orientation}`;
    else if (paperSize === 'LETTER') sizeParam = `letter ${orientation}`;
    else if (paperSize === 'THERMAL_80') sizeParam = '80mm auto';
    else if (paperSize === 'THERMAL_58') sizeParam = '58mm auto';
    else if (paperSize === 'CR80') sizeParam = '85.6mm 53.98mm';

    if (marginSize === 'none') marginParam = '0mm';
    else if (marginSize === 'compact') marginParam = paperSize.startsWith('THERMAL') ? '2mm' : '4mm';
    else if (marginSize === 'normal') marginParam = paperSize.startsWith('THERMAL') ? '4mm' : '8mm';
    else if (marginSize === 'spacious') marginParam = '12mm';

    return `
      @page {
        size: ${sizeParam};
        margin: ${marginParam};
      }
    `;
  }, [paperSize, orientation, marginSize]);

  // Grid styling for print container
  const gridClasses = useMemo(() => {
    if (paperSize === 'THERMAL_80') return 'max-w-[80mm] grid-cols-1 gap-3';
    if (paperSize === 'THERMAL_58') return 'max-w-[58mm] grid-cols-1 gap-2';
    if (paperSize === 'CR80') return 'max-w-md grid-cols-1 sm:grid-cols-2 gap-3';

    switch (columns) {
      case 1:
        return 'max-w-xl grid-cols-1 gap-4';
      case 2:
        return 'max-w-3xl grid-cols-2 gap-3.5';
      case 3:
        return 'max-w-5xl grid-cols-3 gap-3';
      case 4:
        return 'max-w-6xl grid-cols-4 gap-2.5';
      case 5:
        return 'max-w-7xl grid-cols-5 gap-2';
      default:
        return 'max-w-5xl grid-cols-3 gap-3';
    }
  }, [paperSize, columns]);

  // Scale multiplier styling
  const scaleClass = useMemo(() => {
    switch (cardScale) {
      case 'compact':
        return 'text-[10px] p-2';
      case 'large':
        return 'text-sm p-4';
      default:
        return 'text-xs p-3';
    }
  }, [cardScale]);

  const handlePrint = () => {
    window.print();
  };

  const resetCustomizations = () => {
    setPaperSize('A4');
    setOrientation('portrait');
    setColumns(3);
    setCardTheme('modern');
    setCardScale('standard');
    setMarginSize('compact');
    setBusinessName(defaultBusinessName);
    setSupportPhone(defaultPhone);
    setHotspotAddress(defaultHotspotAddress);
    setShowQrCode(true);
    setShowPassword(true);
    setShowPrice(true);
    setShowPackageName(true);
    setShowSpeed(true);
    setShowBatchId(false);
    setShowPhone(true);
    setShowLoginIp(true);
    setShowCutMarks(true);
    setShowFooterNote(true);
    setColorMode('color');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col overflow-hidden text-slate-100">
      {/* Injected Print Page CSS */}
      <style>{pageCss}</style>

      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 z-20 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              ভাউচার প্রিন্ট স্টুডিও (Voucher Print Studio)
              <span className="px-2 py-0.5 text-[10px] bg-brand-900/60 text-brand-300 border border-brand-700/50 rounded-full font-mono font-normal">
                {initialVouchers.length} টি ভাউচার
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              কাগজের সাইজ, গ্রিড ও ডিজাইন কাস্টমাইজ করে নিখুঁতভাবে প্রিন্ট করুন
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden md:flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(prev - 15, 60))}
              className="p-1.5 hover:text-brand-300 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[11px] text-slate-300 min-w-[42px] text-center">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(prev + 15, 150))}
              className="p-1.5 hover:text-brand-300 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
              isSidebarOpen
                ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSidebarOpen ? 'কন্ট্রোল প্যানেল' : 'কাস্টমাইজ'}</span>
          </button>

          {/* Export HTML Button */}
          <button
            onClick={() =>
              downloadVouchersHtmlFile({
                vouchers: initialVouchers,
                settings: {
                  businessName,
                  businessTagline: tagline,
                  supportPhone,
                  currency: 'BDT',
                  currencySymbol: '৳',
                  timezone: 'Asia/Dhaka',
                  voucherPrefix: 'HS-',
                  voucherLength: 6,
                  defaultPackageId: 'pkg-1d',
                  defaultValidityMode: 'FROM_FIRST_LOGIN',
                  termsAndConditionsBangla: '',
                  termsAndConditionsEnglish: '',
                  businessLogoUrl: null,
                  developerCredit: ''
                },
                hotspotAddress,
                filename: `vouchers_print_sheet_${new Date().toISOString().slice(0, 10)}.html`
              })
            }
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-700/60 rounded-xl text-xs font-bold text-emerald-300 transition shadow-sm"
            title="শেয়ার বাটন ও কিউআর কোডসহ অফলাইন HTML ফাইল ডাউনলোড করুন"
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">HTML এক্সপোর্ট</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-brand-500/20 transition transform active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>প্রিন্ট করুন (Print)</span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body: Left Customizer Sidebar + Right Print Canvas Preview */}
      <div className="flex-1 flex overflow-hidden">
        {/* Customization Sidebar (Collapsible) */}
        {isSidebarOpen && (
          <aside className="w-80 sm:w-96 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto no-print">
            <div className="p-4 space-y-5">
              {/* Header with Reset */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                  <Settings2 className="w-4 h-4 text-brand-400" />
                  <span>পেজ ও ডিজাইন সেটাপ</span>
                </div>
                <button
                  onClick={resetCustomizations}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-300 transition"
                  title="ডিফল্ট সেটাপে ফেরত যান"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>রিসেট</span>
                </button>
              </div>

              {/* 1. Paper Size & Orientation */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  <span>কাগজের সাইজ (Paper Size)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'A4', label: 'A4 পেজ' },
                    { id: 'A5', label: 'A5 শিট' },
                    { id: 'LETTER', label: 'Letter' },
                    { id: 'THERMAL_80', label: '80mm POS' },
                    { id: 'THERMAL_58', label: '58mm POS' },
                    { id: 'CR80', label: 'PVC Card' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setPaperSize(item.id as PaperSize)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition text-center ${
                        paperSize === item.id
                          ? 'bg-brand-600 border-brand-500 text-white font-bold shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Orientation (Only for sheet sizes) */}
                {!paperSize.startsWith('THERMAL') && (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setOrientation('portrait')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                        orientation === 'portrait'
                          ? 'bg-slate-800 border-brand-500 text-brand-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Portrait (লম্বা)
                    </button>
                    <button
                      onClick={() => setOrientation('landscape')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium border transition ${
                        orientation === 'landscape'
                          ? 'bg-slate-800 border-brand-500 text-brand-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Landscape (আড়াআড়ি)
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Grid Columns & Scale */}
              {!paperSize.startsWith('THERMAL') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <LayoutGrid className="w-3.5 h-3.5 text-brand-400" />
                      <span>কলাম সংখ্যা (Columns)</span>
                    </label>
                    <span className="text-xs font-bold text-brand-400">{columns} Columns</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((col) => (
                      <button
                        key={col}
                        onClick={() => setColumns(col)}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition ${
                          columns === col
                            ? 'bg-brand-600 border-brand-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>

                  {/* Card Scale */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    {[
                      { id: 'compact', label: 'কমপ্যাক্ট (ছোট)' },
                      { id: 'standard', label: 'স্ট্যান্ডার্ড' },
                      { id: 'large', label: 'বড় সাইজ' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setCardScale(item.id as CardScale)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition ${
                          cardScale === item.id
                            ? 'bg-slate-800 border-brand-500 text-brand-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Card Theme Style */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-brand-400" />
                  <span>ডিজাইন থিম (Card Template)</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'modern', label: 'মডার্ন মিনিমাল' },
                    { id: 'gradient', label: 'কালারফুল গ্র্যাডিয়েন্ট' },
                    { id: 'dashed', label: 'কাটিং লাইন (Scissors)' },
                    { id: 'badge', label: 'আইডি কার্ড / ব্যাজ' },
                    { id: 'thermal', label: 'থার্মাল রসিদ স্টাইল' },
                    { id: 'minimal', label: 'সাদা-কালো (ইঙ্ক সেভার)' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCardTheme(item.id as CardTheme)}
                      className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition ${
                        cardTheme === item.id
                          ? 'bg-brand-950/80 border-brand-500 text-brand-200 font-bold shadow-inner'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px]">{item.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Branding & Custom Text */}
              <div className="space-y-2.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-brand-400" />
                  <span>ব্র্যান্ডিং ও টেক্সট তথ্য</span>
                </label>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">হটস্পট / প্রতিষ্ঠানের নাম:</label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">ট্যাগলাইন / সাবটাইটেল:</label>
                    <input
                      type="text"
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 mb-0.5 block">হেল্পলাইন নম্বর:</label>
                      <input
                        type="text"
                        value={supportPhone}
                        onChange={(e) => setSupportPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 mb-0.5 block">লগইন আইপি / ডোমেন:</label>
                      <input
                        type="text"
                        value={hotspotAddress}
                        onChange={(e) => setHotspotAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">ব্যবহার নির্দেশিকা ফরম্যাট:</label>
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {[
                        { id: 'detailed', label: '৩-ধাপ গাইড' },
                        { id: 'compact', label: '১-লাইন নোট' },
                        { id: 'none', label: 'বন্ধ' }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setInstructionStyle(item.id as 'detailed' | 'compact' | 'none')}
                          className={`px-1.5 py-1 rounded-md text-[10px] font-medium border text-center transition ${
                            instructionStyle === item.id
                              ? 'bg-brand-600 border-brand-500 text-white font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 mb-0.5 block">কাস্টম ফুটার নোট:</label>
                    <input
                      type="text"
                      value={footerNote}
                      onChange={(e) => setFooterNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Credential Layout (User & PIN Format) */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-brand-400" />
                  <span>লগইন কোড ও পিন ফরম্যাট (PIN Format)</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'combined', label: 'কোড ও পিন' },
                    { id: 'user_pass', label: 'আলাদা বক্স (User+Pass)' },
                    { id: 'pin_only', label: 'শুধুমাত্র PIN' }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCredentialLayout(item.id as 'user_pass' | 'pin_only' | 'combined')}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition ${
                        credentialLayout === item.id
                          ? 'bg-brand-600 border-brand-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 6. Field Visibility Checkboxes */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-brand-400" />
                  <span>ফিল্ড প্রদর্শন নিয়ন্ত্রণ (Visibility)</span>
                </label>
                <div className="grid grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showQrCode}
                      onChange={(e) => setShowQrCode(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>QR Code</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>Password (PIN)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showPrice}
                      onChange={(e) => setShowPrice(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>মূল্য (৳ Price)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showPackageName}
                      onChange={(e) => setShowPackageName(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>প্যাকেজ নাম</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showSpeed}
                      onChange={(e) => setShowSpeed(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>স্পিড / স্পিড লিমিট</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>হেল্পলাইন ফোন</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showLoginIp}
                      onChange={(e) => setShowLoginIp(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>লগইন ঠিকানা</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showCutMarks}
                      onChange={(e) => setShowCutMarks(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>কাঁচি কাটিং দাগ ✂</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showBatchId}
                      onChange={(e) => setShowBatchId(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>ব্যাচ আইডি</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white">
                    <input
                      type="checkbox"
                      checked={showFooterNote}
                      onChange={(e) => setShowFooterNote(e.target.checked)}
                      className="rounded text-brand-600 focus:ring-brand-500"
                    />
                    <span>ব্যবহার নির্দেশিকা</span>
                  </label>
                </div>
              </div>

              {/* 7. Margins & Color Mode */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">মার্জিন (Margin):</label>
                  <select
                    value={marginSize}
                    onChange={(e) => setMarginSize(e.target.value as MarginSize)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="none">মার্জিন ছাড়া (0mm)</option>
                    <option value="compact">কমপ্যাক্ট (4mm)</option>
                    <option value="normal">স্ট্যান্ডার্ড (8mm)</option>
                    <option value="spacious">প্রশস্ত (12mm)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 mb-1 block">কালার মোড:</label>
                  <select
                    value={colorMode}
                    onChange={(e) => setColorMode(e.target.value as 'color' | 'mono')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
                  >
                    <option value="color">Full Color (রঙিন)</option>
                    <option value="mono">Eco B&W (সাদা-কালো)</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Right Live Print Sheet Preview Canvas */}
        <main className="flex-1 bg-slate-950 overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full flex justify-center"
          >
            {/* Printable Voucher Sheet */}
            <div
              id="printable-voucher-sheet"
              className={`w-full bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 grid ${gridClasses} transition-all duration-200`}
            >
              {initialVouchers.map((v, idx) => (
                <div
                  key={v.id}
                  className={`page-break-inside-avoid relative flex flex-col justify-between transition-all ${scaleClass} ${
                    cardTheme === 'dashed'
                      ? 'border-2 border-dashed border-slate-400 rounded-xl bg-slate-50'
                      : cardTheme === 'gradient'
                      ? 'border border-blue-200 rounded-2xl shadow-sm bg-gradient-to-b from-blue-50/70 to-white overflow-hidden'
                      : cardTheme === 'badge'
                      ? 'border-2 border-slate-800 rounded-2xl bg-white shadow'
                      : cardTheme === 'thermal'
                      ? 'border-b-2 border-dashed border-black pb-4 mb-2 bg-white font-mono'
                      : cardTheme === 'minimal'
                      ? 'border border-black rounded-lg bg-white'
                      : 'border border-slate-300 rounded-2xl bg-white shadow-sm hover:border-brand-500/50'
                  }`}
                >
                  {/* Scissors Icon for Dashed Cut-out */}
                  {showCutMarks && cardTheme === 'dashed' && (
                    <div className="absolute -top-3 -right-2 text-slate-400 select-none no-print">
                      <Scissors className="w-3.5 h-3.5 transform -rotate-45" />
                    </div>
                  )}

                  {/* Top Header Card Info */}
                  <div>
                    {/* Header Bar */}
                    <div
                      className={`flex items-center justify-between pb-1.5 mb-2 ${
                        cardTheme === 'gradient'
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white -mx-3 -mt-3 p-2.5 rounded-t-xl mb-2.5'
                          : cardTheme === 'badge'
                          ? 'bg-slate-900 text-white -mx-3 -mt-3 p-2 rounded-t-xl mb-2'
                          : 'border-b border-slate-200'
                      }`}
                    >
                      <div className="truncate pr-1">
                        <span
                          className={`font-black tracking-tight truncate block ${
                            cardTheme === 'gradient' || cardTheme === 'badge'
                              ? 'text-white text-xs'
                              : colorMode === 'mono'
                              ? 'text-black font-extrabold'
                              : 'text-brand-700'
                          }`}
                        >
                          {businessName}
                        </span>
                        {tagline && (
                          <span
                            className={`text-[9px] truncate block ${
                              cardTheme === 'gradient' || cardTheme === 'badge'
                                ? 'text-blue-100 opacity-90'
                                : 'text-slate-500'
                            }`}
                          >
                            {tagline}
                          </span>
                        )}
                      </div>

                      {showPrice && (
                        <span
                          className={`font-black px-2 py-0.5 rounded-md whitespace-nowrap text-xs shrink-0 ${
                            cardTheme === 'gradient' || cardTheme === 'badge'
                              ? 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                              : colorMode === 'mono'
                              ? 'border border-black bg-slate-100 text-black font-bold'
                              : 'bg-brand-50 text-brand-700 border border-brand-200'
                          }`}
                        >
                          ৳ {v.package?.price || 30}
                        </span>
                      )}
                    </div>

                    {/* Middle Section: Package Info & QR Code */}
                    <div className="flex items-center gap-2.5 mb-2">
                      {showQrCode && qrMap[v.id] && (
                        <div className="bg-white p-1 rounded-xl border border-slate-200 shrink-0 shadow-inner">
                          <img src={qrMap[v.id]} alt="Voucher QR" className="w-14 h-14 object-contain mx-auto" />
                        </div>
                      )}

                      <div className="space-y-0.5 flex-1 min-w-0">
                        {showPackageName && (
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-semibold">প্যাকেজ:</div>
                            <div className="font-extrabold text-slate-800 truncate leading-tight">
                              {v.package?.name || '1 Day Pass'}
                            </div>
                          </div>
                        )}

                        {showSpeed && v.package && (
                          <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                            <Wifi className="w-2.5 h-2.5 text-slate-400" />
                            <span>স্পিড: {v.package.downloadMbps} Mbps</span>
                          </div>
                        )}

                        {showBatchId && v.batchId && (
                          <div className="text-[8px] text-slate-400 font-mono truncate">
                            ব্যাচ: {v.batchId}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prominent Voucher Code & Password Box */}
                    <div
                      className={`p-2 rounded-xl text-center space-y-1 mb-2 ${
                        cardTheme === 'gradient'
                          ? 'bg-blue-50/90 border border-blue-200'
                          : cardTheme === 'badge'
                          ? 'bg-slate-100 border border-slate-300'
                          : cardTheme === 'thermal'
                          ? 'border border-black py-1.5'
                          : colorMode === 'mono'
                          ? 'bg-slate-100 border border-black'
                          : 'bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {credentialLayout === 'user_pass' ? (
                        <div className="grid grid-cols-2 gap-1.5 text-center">
                          <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                              ইউজার (User)
                            </div>
                            <div className={`font-mono font-black text-sm tracking-wider ${colorMode === 'mono' ? 'text-black' : 'text-slate-900'}`}>
                              {v.code}
                            </div>
                          </div>
                          <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                            <div className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">
                              পাসওয়ার্ড (PIN)
                            </div>
                            <div className={`font-mono font-black text-sm tracking-wider ${colorMode === 'mono' ? 'text-black' : 'text-brand-600'}`}>
                              {v.password || v.code}
                            </div>
                          </div>
                        </div>
                      ) : credentialLayout === 'pin_only' ? (
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                            লগইন পিন (PIN / Code)
                          </div>
                          <div
                            className={`font-mono font-black select-all tracking-wider text-base sm:text-lg leading-tight ${
                              colorMode === 'mono' ? 'text-black' : 'text-slate-900'
                            }`}
                          >
                            {v.password || v.code}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                            ভাউচার কোড (Voucher Code)
                          </div>
                          <div
                            className={`font-mono font-black select-all tracking-wider text-base sm:text-lg leading-tight ${
                              colorMode === 'mono' ? 'text-black' : 'text-slate-900'
                            }`}
                          >
                            {v.code}
                          </div>

                          {showPassword && (
                            <div className="text-[10px] text-slate-700 font-mono flex items-center justify-center gap-1.5 pt-1 border-t border-slate-200/80 mt-1">
                              <KeyRound className="w-3 h-3 text-slate-500" />
                              <span className="font-semibold text-slate-600">পাসওয়ার্ড (PIN):</span>
                              <span className={`font-bold text-xs ${colorMode === 'mono' ? 'text-black' : 'text-brand-700 font-extrabold'}`}>
                                {v.password || v.code}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Usage Instructions Guide */}
                    {instructionStyle === 'detailed' && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-1.5 text-[8px] text-slate-700 space-y-0.5 mb-1.5 text-left leading-snug">
                        <div className="font-bold text-slate-900 flex items-center gap-0.5">
                          <span>📌 ব্যবহার নির্দেশিকা:</span>
                        </div>
                        <div>• ১. Wi-Fi এ কানেক্ট করে ব্রাউজার খুলুন।</div>
                        <div>• ২. কোড/পিন দিন বা QR স্ক্যান করুন।</div>
                        <div>• ৩. Login চাপলেই ইন্টারনেট চালু হবে।</div>
                      </div>
                    )}
                  </div>

                  {/* Bottom Footer Info */}
                  <div className="text-[8px] sm:text-[9px] text-slate-500 text-center border-t border-slate-200 pt-1 space-y-0.5">
                    {(showLoginIp || showPhone) && (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {showLoginIp && (
                          <span>
                            লগইন: <b>{hotspotAddress}</b>
                          </span>
                        )}
                        {showLoginIp && showPhone && <span>•</span>}
                        {showPhone && (
                          <span>
                            হেল্পলাইন: <b>{supportPhone}</b>
                          </span>
                        )}
                      </div>
                    )}

                    {showFooterNote && footerNote && instructionStyle !== 'detailed' && (
                      <div className="text-[8px] text-slate-400 truncate">{footerNote}</div>
                    )}

                    {/* Single Voucher Share / Download Icon (Screen only) */}
                    <div className="pt-1 flex justify-center no-print">
                      <button
                        onClick={() => setShareTargetVoucher(v)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-md text-[9px] font-semibold transition border border-slate-200"
                        title="এই ভাউচারটি ইমেজ আকারে ডাউনলোড বা শেয়ার করুন"
                      >
                        <Share2 className="w-2.5 h-2.5 text-emerald-600" />
                        <span>শেয়ার / ইমেজ ডাউনলোড</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Individual Voucher Share & Download Modal */}
      {shareTargetVoucher && (
        <VoucherShareModal
          voucher={shareTargetVoucher}
          settings={{
            businessName,
            businessTagline: tagline,
            supportPhone,
            currency: 'BDT',
            currencySymbol: '৳',
            timezone: 'Asia/Dhaka',
            voucherPrefix: 'HS-',
            voucherLength: 6,
            defaultPackageId: 'pkg-1d',
            defaultValidityMode: 'FROM_FIRST_LOGIN',
            termsAndConditionsBangla: '',
            termsAndConditionsEnglish: '',
            businessLogoUrl: null,
            developerCredit: ''
          }}
          hotspotAddress={hotspotAddress}
          onClose={() => setShareTargetVoucher(null)}
        />
      )}
    </div>
  );
};

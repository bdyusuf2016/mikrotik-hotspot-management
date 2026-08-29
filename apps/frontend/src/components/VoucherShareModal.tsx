import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import type { HotspotVoucher, SystemSettings } from '@hotspot/shared';
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  MessageSquare,
  Send,
  Wifi,
  KeyRound,
  Clock,
  Phone,
  Globe,
  Tag,
  CheckCircle2,
  FileImage,
  Sparkles,
  Info
} from 'lucide-react';

interface VoucherShareModalProps {
  voucher: HotspotVoucher;
  settings?: SystemSettings | null;
  hotspotAddress?: string;
  onClose: () => void;
}

export const VoucherShareModal: React.FC<VoucherShareModalProps> = ({
  voucher,
  settings,
  hotspotAddress = '10.20.20.1',
  onClose
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const businessName = settings?.businessName || 'Yusuf Computer & IT';
  const supportPhone = settings?.supportPhone || '01933814200';
  const tagline = settings?.businessTagline || 'হাই-স্পিড ওয়াইফাই হটস্পট';
  const password = voucher.password || voucher.code;
  const packageName = voucher.package?.name || '1 Day Unlimited';
  const price = voucher.package?.price || 30;
  const speed = voucher.package?.downloadMbps ? `${voucher.package.downloadMbps} Mbps` : '5 Mbps';

  const shareText = `📡 *${businessName}* — হটস্পট ভাউচার
──────────────────────
📦 *প্যাকেজ:* ${packageName} (${speed})
💰 *মূল্য:* ৳ ${price}
🔑 *ভাউচার কোড:* ${voucher.code}
🔒 *পাসওয়ার্ড/PIN:* ${password}
🌐 *লগইন পোর্টাল:* http://${hotspotAddress}
📞 *হেল্পলাইন:* ${supportPhone}
──────────────────────
📌 *ব্যবহার নির্দেশিকা:*
১. মোবাইলের Wi-Fi অন করে হটস্পটে কানেক্ট করুন।
২. স্বয়ংক্রিয় লগইন পেজ আসবে (অথবা ব্রাউজারে http://${hotspotAddress} লিখুন)।
৩. ভাউচার কোড ও পাসওয়ার্ড দিন অথবা QR কোড স্ক্যান করুন।
৪. "Login" চাপলেই দ্রুতগতির ইন্টারনেট চালু হবে!`;

  // 1. Generate QR Code
  useEffect(() => {
    async function genQr() {
      try {
        const loginUrl = `http://${hotspotAddress}/login?username=${encodeURIComponent(voucher.code)}&password=${encodeURIComponent(password)}`;
        const url = await QRCode.toDataURL(loginUrl, {
          margin: 1,
          width: 200,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error('QR generation failed:', err);
      }
    }
    genQr();
  }, [voucher, password, hotspotAddress]);

  // 2. Render High-Resolution Voucher Card onto HTML5 Canvas for Image Download/Attachment
  useEffect(() => {
    if (!qrDataUrl) return;

    const canvas = document.createElement('canvas');
    canvasRef.current = canvas;
    const width = 800;
    const height = 1020;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsGeneratingImage(true);

    // Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Card Inner Container
    const cardMargin = 30;
    const cardW = width - cardMargin * 2;
    const cardH = height - cardMargin * 2;

    // Draw rounded outer card box
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, cardH, 24);
    ctx.fill();

    // Top Header Banner Gradient
    const headerGrad = ctx.createLinearGradient(cardMargin, cardMargin, cardMargin + cardW, cardMargin);
    headerGrad.addColorStop(0, '#0284c7');
    headerGrad.addColorStop(1, '#2563eb');
    ctx.fillStyle = headerGrad;
    ctx.beginPath();
    ctx.roundRect(cardMargin, cardMargin, cardW, 140, [24, 24, 0, 0]);
    ctx.fill();

    // Header Text: Business Name & Tagline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
    ctx.fillText(businessName, cardMargin + 30, cardMargin + 55);

    ctx.fillStyle = '#e0f2fe';
    ctx.font = '20px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
    ctx.fillText(tagline, cardMargin + 30, cardMargin + 95);

    // Price Badge in Header
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cardMargin + cardW - 170, cardMargin + 35, 140, 65, 16);
    ctx.fill();

    ctx.fillStyle = '#0284c7';
    ctx.font = 'bold 28px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`৳ ${price}`, cardMargin + cardW - 100, cardMargin + 78);
    ctx.textAlign = 'left';

    // Package Details Bar
    let curY = cardMargin + 175;
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(cardMargin + 25, curY, cardW - 50, 75, 14);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 16px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
    ctx.fillText('প্যাকেজ নাম ও স্পিড:', cardMargin + 45, curY + 32);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 24px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
    ctx.fillText(`${packageName}  (${speed})`, cardMargin + 45, curY + 62);

    // QR Code Image & Credentials Side by Side
    curY += 105;
    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    qrImg.onload = () => {
      // Draw QR code
      const qrSize = 190;
      ctx.drawImage(qrImg, cardMargin + 35, curY, qrSize, qrSize);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(cardMargin + 35, curY, qrSize, qrSize);

      // Credentials Box on the Right
      const credX = cardMargin + 245;
      const credW = cardW - 275;
      const credH = qrSize;

      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(credX, curY, credW, credH, 16);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      // Username / Code
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
      ctx.fillText('ভাউচার কোড (Voucher Code):', credX + 20, curY + 38);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 32px "Courier New", Consolas, monospace';
      ctx.fillText(voucher.code, credX + 20, curY + 76);

      // Password / PIN
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
      ctx.fillText('পাসওয়ার্ড / লগইন PIN:', credX + 20, curY + 125);

      ctx.fillStyle = '#0284c7';
      ctx.font = '900 30px "Courier New", Consolas, monospace';
      ctx.fillText(password, credX + 20, curY + 162);

      // Detailed 4-Step Usage Guide Box
      curY += qrSize + 30;
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.roundRect(cardMargin + 25, curY, cardW - 50, 205, 16);
      ctx.fill();
      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#166534';
      ctx.font = 'bold 20px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
      ctx.fillText('📌 সহজ ব্যবহার নির্দেশিকা (How to Connect):', cardMargin + 45, curY + 36);

      ctx.fillStyle = '#1e293b';
      ctx.font = '17px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
      ctx.fillText('১. মোবাইলের Wi-Fi অন করে হটস্পট নেটওয়ার্কে কানেক্ট করুন।', cardMargin + 45, curY + 75);
      ctx.fillText(`২. স্বয়ংক্রিয় লগইন পেজ আসবে (অথবা ব্রাউজারে http://${hotspotAddress} লিখুন)।`, cardMargin + 45, curY + 112);
      ctx.fillText('৩. ক্যামেরায় QR কোড স্ক্যান করুন অথবা কোড ও পিন দিয়ে "Login" চাপুন।', cardMargin + 45, curY + 149);
      ctx.fillText('৪. সংযোগ সফল হলে হাই-স্পিড ইন্টারনেট উপভোগ করুন!', cardMargin + 45, curY + 186);

      // Footer: Helpline & Login Address
      curY += 230;
      ctx.fillStyle = '#64748b';
      ctx.font = '16px "Hind Siliguri", "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`লগইন ঠিকানা: http://${hotspotAddress}   |   হেল্পলাইন: ${supportPhone}`, width / 2, curY);

      canvas.toBlob((blob) => {
        if (blob) {
          setImageBlob(blob);
          setImageUrl(URL.createObjectURL(blob));
          setIsGeneratingImage(false);
        }
      }, 'image/png');
    };
  }, [qrDataUrl, businessName, tagline, supportPhone, hotspotAddress, packageName, price, speed, voucher, password]);

  // 3. Download Voucher Image to Mobile / PC Storage
  const handleDownloadImage = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `Voucher_${voucher.code}_${packageName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 4. Native Web Share (with Image Attachment on supported mobile devices)
  const handleNativeShare = async () => {
    try {
      if (imageBlob && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'voucher.png', { type: 'image/png' })] })) {
        const file = new File([imageBlob], `Voucher_${voucher.code}.png`, { type: 'image/png' });
        await navigator.share({
          title: `${businessName} WiFi Voucher`,
          text: shareText,
          files: [file]
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else if (navigator.share) {
        await navigator.share({
          title: `${businessName} WiFi Voucher`,
          text: shareText,
          url: `http://${hotspotAddress}`
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: Copy to clipboard
        handleCopyText();
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        handleCopyText();
      }
    }
  };

  // 5. WhatsApp Direct Share
  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  // 6. Copy Formatted Message
  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 my-auto">
        {/* Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                ভাউচার শেয়ার ও ডাউনলোড (Voucher Share)
              </h2>
              <p className="text-[11px] text-slate-400">
                ইমেজ ফাইল ডাউনলোড করুন অথবা সরাসরি WhatsApp ও মেসেঞ্জারে পাঠান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Visual Voucher Ticket Preview */}
          <div className="bg-white text-slate-900 rounded-2xl p-4 shadow-xl border border-slate-200 relative overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-3">
              <div>
                <div className="font-extrabold text-sm text-brand-700">{businessName}</div>
                <div className="text-[10px] text-slate-500">{tagline}</div>
              </div>
              <div className="bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-1 rounded-lg text-xs font-black">
                ৳ {price}
              </div>
            </div>

            {/* QR Code & Credentials Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 items-center">
              {qrDataUrl && (
                <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-center mx-auto sm:mx-0">
                  <img src={qrDataUrl} alt="QR Code" className="w-24 h-24 object-contain mx-auto" />
                  <span className="text-[9px] text-slate-500 font-semibold block mt-0.5">ক্যামেরায় স্ক্যান করুন</span>
                </div>
              )}

              <div className="sm:col-span-2 space-y-2">
                <div className="bg-slate-100 p-2 rounded-xl border border-slate-200">
                  <div className="text-[9px] text-slate-500 uppercase font-bold">ভাউচার কোড (User/Code):</div>
                  <div className="font-mono text-lg font-black text-slate-900 tracking-wider flex items-center justify-between">
                    <span>{voucher.code}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(voucher.code);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Copy Code"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50/90 p-2 rounded-xl border border-blue-200">
                  <div className="text-[9px] text-blue-600 uppercase font-bold">লগইন পিন / পাসওয়ার্ড:</div>
                  <div className="font-mono text-base font-black text-blue-700 tracking-wider">
                    {password}
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Usage Guide (Bengali) */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5 text-[11px] text-slate-800 space-y-1">
              <div className="font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>ব্যবহার নির্দেশিকা (Instructions):</span>
              </div>
              <ul className="space-y-0.5 text-[10px] text-slate-700 pl-1">
                <li>• <b>১.</b> মোবাইলে Wi-Fi অন করে হটস্পটে কানেক্ট করুন।</li>
                <li>• <b>২.</b> ব্রাউজারে লগইন পেজ খুলুন (বা <b>{hotspotAddress}</b> লিখুন)।</li>
                <li>• <b>৩.</b> কোড ও পিন দিয়ে <b>"Login"</b> চাপুন।</li>
              </ul>
            </div>

            {/* Card Footer */}
            <div className="text-[9px] text-slate-500 text-center border-t border-slate-200 pt-2 mt-2 flex items-center justify-between">
              <span>লগইন: <b>{hotspotAddress}</b></span>
              <span>প্যাকেজ: <b>{packageName} ({speed})</b></span>
              <span>হেল্পলাইন: <b>{supportPhone}</b></span>
            </div>
          </div>

          {/* Share & Download Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. Download Voucher Card Image (PNG) */}
              <button
                onClick={handleDownloadImage}
                disabled={isGeneratingImage || !imageUrl}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isGeneratingImage ? 'ইমেজ তৈরি হচ্ছে...' : 'ইমেজ ডাউনলোড (PNG)'}</span>
              </button>

              {/* 2. Direct WhatsApp Share */}
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-green-600/20 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp-এ পাঠান</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 3. Native Device Share (Attachment + Text) */}
              <button
                onClick={handleNativeShare}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-brand-500/20"
              >
                <Share2 className="w-4 h-4" />
                <span>সরাসরি শেয়ার করুন (Share Sheet)</span>
              </button>

              {/* 4. Copy Formatted Message */}
              <button
                onClick={handleCopyText}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-2xl text-xs font-semibold transition"
              >
                {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedText ? 'মেসেজ কপি হয়েছে!' : 'মেসেজ কপি করুন (SMS/Chat)'}</span>
              </button>
            </div>

            {shareSuccess && (
              <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>ভাউচার সফলভাবে শেয়ার করা হয়েছে!</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};

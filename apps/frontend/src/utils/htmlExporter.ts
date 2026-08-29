import QRCode from 'qrcode';
import type { HotspotVoucher, SystemSettings } from '@hotspot/shared';

export interface HtmlExportOptions {
  vouchers: HotspotVoucher[];
  settings?: SystemSettings | null;
  hotspotAddress?: string;
  filename?: string;
}

export async function generateVouchersHtml({
  vouchers,
  settings,
  hotspotAddress = '10.20.20.1'
}: HtmlExportOptions): Promise<string> {
  const businessName = settings?.businessName || 'Yusuf Computer & IT';
  const supportPhone = settings?.supportPhone || '01933814200';
  const tagline = settings?.businessTagline || 'হাই-স্পিড ওয়াইফাই হটস্পট';
  const exportDate = new Date().toLocaleString('bn-BD', {
    dateStyle: 'full',
    timeStyle: 'short'
  });

  // Generate QR Code data URIs for all vouchers
  const vouchersWithQr = await Promise.all(
    vouchers.map(async (v) => {
      const password = v.password || v.code;
      const loginUrl = `http://${hotspotAddress}/login?username=${encodeURIComponent(v.code)}&password=${encodeURIComponent(password)}`;
      let qrDataUrl = '';
      try {
        qrDataUrl = await QRCode.toDataURL(loginUrl, {
          margin: 1,
          width: 140,
          color: { dark: '#0f172a', light: '#ffffff' }
        });
      } catch (err) {
        console.warn('QR generation error for voucher:', v.code, err);
      }
      return {
        ...v,
        password,
        qrDataUrl
      };
    })
  );

  // Generate self-contained, standalone HTML
  return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${businessName} - হটস্পট ভাউচার তালিকা</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=JetBrains+Mono:wght@600;800&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Hind Siliguri', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #090d16;
      color: #f1f5f9;
      padding: 20px;
      line-height: 1.5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    /* Header Toolbar */
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .brand-info h1 {
      font-size: 24px;
      font-weight: 700;
      color: #38bdf8;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .brand-info p {
      font-size: 13px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      border: none;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .btn-primary {
      background: #0284c7;
      color: #ffffff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.4);
    }
    .btn-primary:hover {
      background: #0369a1;
      transform: translateY(-1px);
    }
    .btn-whatsapp {
      background: #25D366;
      color: #0f172a;
      font-weight: 800;
      box-shadow: 0 4px 14px rgba(37, 211, 102, 0.3);
    }
    .btn-whatsapp:hover {
      background: #20bd5a;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #1e293b;
      color: #cbd5e1;
      border: 1px solid #334155;
    }
    .btn-secondary:hover {
      background: #334155;
      color: #ffffff;
    }
    /* Filter Bar */
    .filter-bar {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 12px 16px;
      margin-bottom: 24px;
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .search-input {
      flex: 1;
      background: #020617;
      border: 1px solid #334155;
      border-radius: 10px;
      padding: 8px 14px;
      color: #f1f5f9;
      font-size: 13px;
      outline: none;
      font-family: inherit;
    }
    .search-input:focus {
      border-color: #38bdf8;
    }
    .voucher-counter {
      font-size: 12px;
      color: #94a3b8;
      white-space: nowrap;
      font-weight: 600;
    }
    /* Voucher Grid */
    .voucher-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }
    /* Voucher Card */
    .voucher-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-col;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      border: 2px dashed #cbd5e1;
      page-break-inside: avoid;
      break-inside: avoid;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .voucher-card:hover {
      border-color: #0284c7;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .card-brand {
      font-size: 15px;
      font-weight: 800;
      color: #0284c7;
      line-height: 1.2;
    }
    .card-tagline {
      font-size: 10px;
      color: #64748b;
    }
    .card-price {
      background: #e0f2fe;
      color: #0369a1;
      font-weight: 900;
      font-size: 14px;
      padding: 4px 10px;
      border-radius: 8px;
      border: 1px solid #bae6fd;
    }
    .card-body {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-bottom: 12px;
    }
    .card-qr {
      width: 90px;
      height: 90px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 4px;
      background: #ffffff;
      flex-shrink: 0;
    }
    .card-pkg-info {
      flex: 1;
    }
    .pkg-title {
      font-size: 14px;
      font-weight: 800;
      color: #1e293b;
    }
    .pkg-speed {
      font-size: 12px;
      color: #0284c7;
      font-weight: 700;
      margin-top: 2px;
    }
    .pkg-batch {
      font-size: 10px;
      color: #94a3b8;
      font-family: 'JetBrains Mono', monospace;
    }
    /* Credentials Box */
    .cred-box {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 14px;
      padding: 10px 14px;
      text-align: center;
      margin-bottom: 12px;
    }
    .cred-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .cred-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: 1px;
      margin: 2px 0;
    }
    .cred-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #0369a1;
      font-weight: 800;
      border-top: 1px solid #e2e8f0;
      padding-top: 4px;
      margin-top: 4px;
    }
    /* Usage Guide */
    .guide-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 8px 10px;
      font-size: 10px;
      color: #166534;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .guide-box b {
      color: #14532d;
    }
    /* Card Footer & Share Actions */
    .card-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      font-size: 10px;
      color: #64748b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #e2e8f0;
    }
    .btn-card {
      flex: 1;
      padding: 6px 10px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.15s;
    }
    .btn-card:hover {
      background: #0284c7;
      color: #ffffff;
      border-color: #0284c7;
    }
    .btn-card-wa {
      background: #f0fdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .btn-card-wa:hover {
      background: #25D366;
      color: #0f172a;
      border-color: #25D366;
    }
    /* Toast Alert */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0284c7;
      color: #ffffff;
      padding: 12px 20px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      display: none;
      z-index: 100;
      animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    /* Print Styles */
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      .header, .filter-bar, .card-actions, .toast {
        display: none !important;
      }
      .voucher-grid {
        display: grid !important;
        grid-template-columns: repeat(3, 1fr) !important;
        gap: 12px !important;
      }
      .voucher-card {
        border: 2px dashed #94a3b8 !important;
        box-shadow: none !important;
        padding: 14px !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="brand-info">
        <h1>📡 ${businessName}</h1>
        <p>${tagline} | হেল্পলাইন: ${supportPhone} | এক্সপোর্ট তারিখ: ${exportDate}</p>
      </div>

      <div class="toolbar-actions">
        <button onclick="window.print()" class="btn btn-primary">
          🖨️ সম্পূর্ণ শিট প্রিন্ট করুন
        </button>
        <button onclick="shareAllVouchersSummary()" class="btn btn-whatsapp">
          📲 সম্পূর্ণ লিস্ট শেয়ার (WhatsApp)
        </button>
      </div>
    </div>

    <!-- Live Search & Filter Bar -->
    <div class="filter-bar">
      <input
        type="text"
        id="searchVoucher"
        class="search-input"
        placeholder="🔍 ভাউচার কোড, প্যাকেজ বা ব্যাচ আইডি দিয়ে ফিল্টার করুন..."
        onkeyup="filterVouchers()"
      >
      <span class="voucher-counter" id="voucherCounter">মোট ${vouchers.length} টি ভাউচার</span>
    </div>

    <!-- Vouchers Grid -->
    <div class="voucher-grid" id="voucherContainer">
      ${vouchersWithQr
        .map(
          (v) => `
      <div class="voucher-card" data-code="${v.code.toLowerCase()}" data-pkg="${(v.package?.name || '').toLowerCase()}" data-batch="${(v.batchId || '').toLowerCase()}">
        <div>
          <!-- Card Header -->
          <div class="card-header">
            <div>
              <div class="card-brand">${businessName}</div>
              <div class="card-tagline">${tagline}</div>
            </div>
            <div class="card-price">৳ ${v.package?.price || 30}</div>
          </div>

          <!-- Body -->
          <div class="card-body">
            ${v.qrDataUrl ? `<img src="${v.qrDataUrl}" alt="QR" class="card-qr">` : ''}
            <div class="card-pkg-info">
              <div class="pkg-title">${v.package?.name || '1 Day Unlimited'}</div>
              <div class="pkg-speed">স্পিড: ${v.package?.downloadMbps || 5} Mbps</div>
              ${v.batchId ? `<div class="pkg-batch">ব্যাচ: ${v.batchId}</div>` : ''}
            </div>
          </div>

          <!-- Credentials Box -->
          <div class="cred-box">
            <div class="cred-label">ভাউচার কোড (Voucher Code)</div>
            <div class="cred-code">${v.code}</div>
            <div class="cred-pin">
              <span>পাসওয়ার্ড (PIN):</span>
              <span>${v.password}</span>
            </div>
          </div>

          <!-- Usage Instructions -->
          <div class="guide-box">
            <b>📌 ব্যবহার নির্দেশিকা:</b><br>
            ১. Wi-Fi এ কানেক্ট করে ব্রাউজার খুলুন।<br>
            ২. কোড/পিন দিন বা QR কোড স্ক্যান করুন।<br>
            ৩. <b>"Login"</b> চাপলেই ইন্টারনেট চালু হবে।
          </div>
        </div>

        <!-- Footer -->
        <div>
          <div class="card-footer">
            <span>লগইন: <b>${hotspotAddress}</b></span>
            <span>হেল্পলাইন: <b>${supportPhone}</b></span>
          </div>

          <!-- Individual Card Share Buttons -->
          <div class="card-actions">
            <button onclick="shareVoucherWhatsApp('${v.code}', '${v.password}', '${v.package?.name || 'HotSpot Pass'}', '${v.package?.price || 30}')" class="btn-card btn-card-wa">
              📲 WhatsApp
            </button>
            <button onclick="copyVoucherDetails('${v.code}', '${v.password}', '${v.package?.name || 'HotSpot Pass'}', '${v.package?.price || 30}')" class="btn-card">
              📋 মেসেজ কপি
            </button>
            <button onclick="copyPin('${v.password}')" class="btn-card">
              🔑 PIN কপি
            </button>
          </div>
        </div>
      </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div id="toast" class="toast">মেসেজ কপি হয়েছে!</div>

  <script>
    const businessName = "${businessName}";
    const supportPhone = "${supportPhone}";
    const hotspotAddress = "${hotspotAddress}";

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.innerText = msg;
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 2500);
    }

    function copyPin(pin) {
      navigator.clipboard.writeText(pin);
      showToast('লগইন PIN কপি হয়েছে: ' + pin);
    }

    function copyVoucherDetails(code, pin, pkg, price) {
      const text = \`📡 *\${businessName}* — হটস্পট ভাউচার
──────────────────
📦 প্যাকেজ: \${pkg}
💰 মূল্য: ৳ \${price}
🔑 ভাউচার কোড: \${code}
🔒 পাসওয়ার্ড/PIN: \${pin}
🌐 লগইন পোর্টাল: http://\${hotspotAddress}
📞 হেল্পলাইন: \${supportPhone}
──────────────────
📌 নির্দেশিকা: Wi-Fi এ কানেক্ট করে ব্রাউজারে কোড/পিন দিয়ে লগইন করুন।\`;
      navigator.clipboard.writeText(text);
      showToast('ভাউচার মেসেজ কপি হয়েছে!');
    }

    function shareVoucherWhatsApp(code, pin, pkg, price) {
      const text = \`📡 *\${businessName}* — হটস্পট ভাউচার
──────────────────
📦 প্যাকেজ: \${pkg}
💰 মূল্য: ৳ \${price}
🔑 ভাউচার কোড: \${code}
🔒 পাসওয়ার্ড/PIN: \${pin}
🌐 লগইন পোর্টাল: http://\${hotspotAddress}
📞 হেল্পলাইন: \${supportPhone}
──────────────────
📌 নির্দেশিকা: Wi-Fi এ কানেক্ট করে ব্রাউজারে কোড/পিন দিয়ে লগইন করুন।\`;
      const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
    }

    function shareAllVouchersSummary() {
      const text = \`📡 *\${businessName}* — হটস্পট ভাউচার তালিকা
মোট ভাউচার: ${vouchers.length} টি
লগইন পোর্টাল: http://\${hotspotAddress}
হেল্পলাইন: \${supportPhone}\`;
      const url = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(text);
      window.open(url, '_blank');
    }

    function filterVouchers() {
      const input = document.getElementById('searchVoucher').value.toLowerCase();
      const cards = document.getElementsByClassName('voucher-card');
      let visibleCount = 0;
      for (let i = 0; i < cards.length; i++) {
        const code = cards[i].getAttribute('data-code') || '';
        const pkg = cards[i].getAttribute('data-pkg') || '';
        const batch = cards[i].getAttribute('data-batch') || '';
        if (code.includes(input) || pkg.includes(input) || batch.includes(input)) {
          cards[i].style.display = 'flex';
          visibleCount++;
        } else {
          cards[i].style.display = 'none';
        }
      }
      document.getElementById('voucherCounter').innerText = 'মোট ' + visibleCount + ' টি ভাউচার';
    }
  </script>
</body>
</html>`;
}

export async function downloadVouchersHtmlFile(options: HtmlExportOptions): Promise<void> {
  const htmlContent = await generateVouchersHtml(options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const filename =
    options.filename || `vouchers_sheet_${new Date().toISOString().slice(0, 10)}.html`;
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

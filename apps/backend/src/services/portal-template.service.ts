import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { RouterOSSocketClient } from '../adapters/mikrotik/routeros-socket.js';
import { env } from '../config/env.js';
import type { SystemSettings, HotspotPackage } from '@hotspot/shared';

export class PortalTemplateService {
  public static generateLoginHtml(settings: SystemSettings, packages: HotspotPackage[]): string {
    const businessName = settings.businessName || 'Yusuf Computer & IT';
    const tagline = settings.businessTagline || 'স্মার্ট হাই-স্পিড ওয়াইফাই হটস্পট';
    const phone = settings.supportPhone || '01933814200';
    const credit = settings.developerCredit || 'Designed & Developed by Yusuf IT';

    const activePackages = packages.filter(p => p.status === 'ACTIVE').slice(0, 3);
    const pricingCardsHtml = activePackages.length > 0
      ? activePackages.map(p => {
          const durationStr = p.durationMinutes >= 1440
            ? `${Math.round(p.durationMinutes / 1440)} দিন`
            : `${Math.round(p.durationMinutes / 60)} ঘণ্টা`;
          return `<div class="p-card"><div class="p-name">${p.name || durationStr}</div><div class="p-price">৳ ${p.price}</div></div>`;
        }).join('')
      : `<div class="p-card"><div class="p-name">১ দিন</div><div class="p-price">৳ ২০</div></div>
         <div class="p-card"><div class="p-name">৭ দিন</div><div class="p-price">৳ ১০০</div></div>
         <div class="p-card"><div class="p-name">৩০ দিন</div><div class="p-price">৳ ৩৫০</div></div>`;

    return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${businessName} - High-Speed Wi-Fi</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
    body { min-height:100vh; background:linear-gradient(135deg,#090d16 0%,#0f172a 50%,#022c22 100%); display:flex; align-items:center; justify-content:center; padding:16px; color:#f8fafc; }
    .card { width:100%; max-width:390px; background:rgba(15,23,42,0.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.12); border-radius:24px; padding:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.6); }
    .logo-box { text-align:center; margin-bottom:18px; }
    .logo-icon { width:52px; height:52px; background:linear-gradient(135deg,#0284c7,#10b981); border-radius:16px; display:inline-flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(2,132,199,0.35); margin-bottom:10px; }
    .logo-icon svg { width:28px; height:28px; fill:none; stroke:#fff; stroke-width:2.2; stroke-linecap:round; stroke-linejoin:round; }
    .title { font-size:18px; font-weight:800; color:#fff; letter-spacing:-0.3px; }
    .subtitle { font-size:12px; color:#94a3b8; margin-top:2px; }
    .tabs { display:flex; background:rgba(2,6,23,0.65); padding:4px; border-radius:14px; margin-bottom:16px; border:1px solid rgba(255,255,255,0.06); }
    .tab-btn { flex:1; padding:8px; border:none; background:transparent; color:#94a3b8; font-size:12px; font-weight:700; border-radius:10px; cursor:pointer; transition:all 0.2s; }
    .tab-btn.active { background:#0284c7; color:#fff; box-shadow:0 4px 12px rgba(2,132,199,0.4); }
    .form-group { margin-bottom:13px; }
    .label { display:block; font-size:11px; font-weight:600; color:#cbd5e1; margin-bottom:5px; }
    .input { width:100%; padding:11px 13px; background:rgba(2,6,23,0.75); border:1px solid rgba(255,255,255,0.15); border-radius:12px; font-size:14px; color:#fff; outline:none; transition:border 0.2s; font-family:monospace; }
    .input:focus { border-color:#0284c7; box-shadow:0 0 0 3px rgba(2,132,199,0.25); }
    .btn-submit { width:100%; padding:13px; background:linear-gradient(135deg,#0284c7 0%,#0ea5e9 100%); border:none; border-radius:12px; color:#fff; font-size:14px; font-weight:800; cursor:pointer; box-shadow:0 8px 20px rgba(2,132,199,0.35); transition:all 0.2s; }
    .btn-submit:hover { opacity:0.95; transform:translateY(-1px); }
    .error-box { background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.35); color:#fca5a5; padding:9px 12px; border-radius:10px; font-size:11px; margin-bottom:13px; text-align:center; font-weight:600; }
    .prices { display:grid; grid-template-columns:repeat(${Math.min(3, activePackages.length || 3)},1fr); gap:6px; margin:16px 0; }
    .p-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:7px 4px; text-align:center; }
    .p-name { font-size:10px; color:#94a3b8; }
    .p-price { font-size:13px; font-weight:800; color:#38bdf8; margin-top:2px; }
    .footer { text-align:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; margin-top:12px; }
    .contact { font-size:11px; color:#94a3b8; }
    .contact a { color:#38bdf8; text-decoration:none; font-weight:700; }
    .dev-credit { font-size:10px; color:#64748b; margin-top:8px; font-weight:500; letter-spacing:0.3px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-box">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><circle cx="12" cy="20" r="1"></circle></svg>
      </div>
      <h1 class="title">${businessName}</h1>
      <p class="subtitle">${tagline}</p>
    </div>

    $(if error)
    <div class="error-box">
      $(error)
    </div>
    $(endif)

    <div class="tabs">
      <button type="button" class="tab-btn active" id="tabVoucher" onclick="setMode('voucher')">ভাউচার কোড</button>
      <button type="button" class="tab-btn" id="tabMember" onclick="setMode('member')">ইউজার আইডি</button>
    </div>

    <form name="login" action="$(link-login-only)" method="post" onsubmit="return handleLogin()">
      <input type="hidden" name="dst" value="$(link-orig)" />
      <input type="hidden" name="popup" value="true" />
      
      <div class="form-group" id="userGroup">
        <label class="label" id="userLabel">ভাউচার কোড লিখুন</label>
        <input class="input" name="username" id="username" type="text" placeholder="যেমন: HS-123456" value="$(username)" required autocomplete="off" autocorrect="off" autocapitalize="off" />
      </div>

      <div class="form-group" id="passGroup" style="display:none;">
        <label class="label">পাসওয়ার্ড (PIN)</label>
        <input class="input" name="password" id="password" type="password" placeholder="পাসওয়ার্ড লিখুন" autocomplete="off" />
      </div>

      <button type="submit" class="btn-submit" id="submitBtn">ইন্টারনেট চালু করুন 🚀</button>
    </form>

    <div class="prices">
      ${pricingCardsHtml}
    </div>

    <div class="footer">
      <div class="contact">হেল্পলাইন / ভাউচার সংগ্রহ: <br><a href="tel:${phone}">📞 ${phone}</a></div>
      <div class="dev-credit">✨ ${credit}</div>
    </div>
  </div>

  <script>
    var mode = 'voucher';
    function setMode(m) {
      mode = m;
      var tv = document.getElementById('tabVoucher');
      var tm = document.getElementById('tabMember');
      var pg = document.getElementById('passGroup');
      var ul = document.getElementById('userLabel');
      var un = document.getElementById('username');
      var pw = document.getElementById('password');

      if (m === 'voucher') {
        tv.className = 'tab-btn active';
        tm.className = 'tab-btn';
        pg.style.display = 'none';
        ul.innerText = 'ভাউচার কোড লিখুন';
        un.placeholder = 'যেমন: HS-123456';
        pw.value = '';
      } else {
        tm.className = 'tab-btn active';
        tv.className = 'tab-btn';
        pg.style.display = 'block';
        ul.innerText = 'ইউজারনেম';
        un.placeholder = 'আপনার ইউজার আইডি';
      }
    }

    function handleLogin() {
      var un = document.getElementById('username').value.trim();
      var pw = document.getElementById('password');
      if (mode === 'voucher' && (!pw.value || pw.value.trim() === '')) {
        pw.value = un;
      }
      return true;
    }
  </script>
</body>
</html>`;
  }

  public static generateStatusHtml(settings: SystemSettings): string {
    const businessName = settings.businessName || 'Yusuf Computer & IT';
    const phone = settings.supportPhone || '01933814200';
    const credit = settings.developerCredit || 'Designed & Developed by Yusuf IT';

    return `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Connection Status - ${businessName}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; }
    body { min-height:100vh; background:linear-gradient(135deg,#090d16 0%,#0f172a 50%,#022c22 100%); display:flex; align-items:center; justify-content:center; padding:16px; color:#f8fafc; }
    .card { width:100%; max-width:410px; background:rgba(15,23,42,0.92); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); border:1px solid rgba(255,255,255,0.12); border-radius:24px; padding:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.6); text-align:center; }
    
    .status-badge { display:inline-flex; align-items:center; gap:8px; background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.35); color:#34d399; font-size:11px; font-weight:700; padding:5px 14px; border-radius:999px; margin-bottom:14px; }
    .status-dot { width:8px; height:8px; background:#10b981; border-radius:50%; box-shadow:0 0 8px #10b981; animation:pulse 2s infinite; }
    @keyframes pulse { 0% { opacity:1; transform:scale(1); } 50% { opacity:0.4; transform:scale(1.2); } 100% { opacity:1; transform:scale(1); } }
    
    .brand-title { font-size:19px; font-weight:800; color:#fff; letter-spacing:-0.3px; }
    .brand-sub { font-size:12px; color:#94a3b8; margin-top:2px; margin-bottom:16px; }

    /* === Hero Countdown Box === */
    .validity-hero { background:linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(2,132,199,0.12) 100%); border:1px solid rgba(16,185,129,0.3); border-radius:20px; padding:16px 10px; margin-bottom:16px; box-shadow:0 8px 24px rgba(16,185,129,0.08); position:relative; overflow:hidden; }
    .validity-hero::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg, #10b981, #38bdf8); }
    .validity-title { font-size:11px; font-weight:700; color:#6ee7b7; text-transform:uppercase; letter-spacing:0.8px; margin-bottom:12px; display:flex; align-items:center; justify-content:center; gap:6px; }
    
    .timer-grid { display:flex; justify-content:center; align-items:center; gap:5px; }
    .timer-pill { flex:1; max-width:68px; background:rgba(2,6,23,0.85); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:8px 2px; box-shadow:inset 0 2px 4px rgba(0,0,0,0.5); }
    .timer-num { font-size:20px; font-weight:800; color:#38bdf8; font-family:monospace; line-height:1; }
    .timer-num.sec { color:#34d399; }
    .timer-label { font-size:9.5px; color:#94a3b8; font-weight:600; margin-top:4px; }
    .timer-colon { font-size:16px; font-weight:800; color:#64748b; margin-top:-6px; }

    .unlimited-box { font-size:16px; font-weight:800; color:#34d399; padding:8px 0; letter-spacing:0.5px; }

    /* === Stats Grid === */
    .grid-stats { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
    .stat-box { background:rgba(2,6,23,0.6); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:10px; text-align:left; }
    .stat-title { font-size:10px; font-weight:600; color:#94a3b8; margin-bottom:3px; }
    .stat-val { font-size:13px; font-weight:800; color:#f1f5f9; font-family:monospace; word-break:break-all; }
    
    .list-stats { background:rgba(2,6,23,0.45); border:1px solid rgba(255,255,255,0.06); border-radius:12px; padding:4px 12px; margin-bottom:18px; }
    .row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:11.5px; }
    .row:last-child { border-bottom:none; }
    .row-label { color:#94a3b8; }
    .row-val { font-weight:700; font-family:monospace; color:#e2e8f0; }

    .btn-row { display:flex; gap:10px; }
    .btn-refresh { flex:1; padding:12px; background:rgba(2,132,199,0.18); border:1px solid rgba(2,132,199,0.35); color:#38bdf8; border-radius:12px; font-size:12.5px; font-weight:700; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s; }
    .btn-refresh:hover { background:rgba(2,132,199,0.3); }
    .btn-logout { flex:1; padding:12px; background:rgba(239,68,68,0.18); border:1px solid rgba(239,68,68,0.35); color:#fca5a5; border-radius:12px; font-size:12.5px; font-weight:700; cursor:pointer; transition:all 0.2s; }
    .btn-logout:hover { background:rgba(239,68,68,0.3); }

    .footer { text-align:center; border-top:1px solid rgba(255,255,255,0.08); padding-top:12px; margin-top:16px; font-size:11px; color:#94a3b8; }
    .footer a { color:#38bdf8; text-decoration:none; font-weight:700; }
    .dev-credit { font-size:10px; color:#64748b; margin-top:6px; font-weight:500; letter-spacing:0.3px; }
  </style>
</head>
<body>
  <!-- Embedded RouterOS raw value -->
  <span id="rosRawTime" style="display:none;">$(session-time-left)</span>

  <div class="card">
    <div class="status-badge">
      <div class="status-dot"></div>
      ইন্টারনেট সংযোগ সক্রিয়
    </div>
    
    <h1 class="brand-title">${businessName}</h1>
    <p class="brand-sub">আপনার ডিভাইসটি বর্তমানে অনলাইনে রয়েছে</p>

    <!-- Hero Validity Countdown Card -->
    <div class="validity-hero">
      <div class="validity-title">
        <span>⏳</span> অবশিষ্ট ইন্টারনেট মেয়াদ (Remaining Time)
      </div>

      <div id="countdownContainer">
        <div class="timer-grid" id="timerGrid">
          <div class="timer-pill">
            <div class="timer-num" id="tDays">00</div>
            <div class="timer-label">দিন</div>
          </div>
          <div class="timer-colon">:</div>
          <div class="timer-pill">
            <div class="timer-num" id="tHours">00</div>
            <div class="timer-label">ঘণ্টা</div>
          </div>
          <div class="timer-colon">:</div>
          <div class="timer-pill">
            <div class="timer-num" id="tMins">00</div>
            <div class="timer-label">মিনিট</div>
          </div>
          <div class="timer-colon">:</div>
          <div class="timer-pill">
            <div class="timer-num sec" id="tSecs">00</div>
            <div class="timer-label">সেকেন্ড</div>
          </div>
        </div>
        <div class="unlimited-box" id="unlimitedBox" style="display:none;">
          ✨ আনলিমিটেড মেয়াদ (Unlimited)
        </div>
      </div>
    </div>

    <div class="grid-stats">
      <div class="stat-box">
        <div class="stat-title">ইউজার / ভাউচার কোড</div>
        <div class="stat-val" style="color:#38bdf8;">$(username)</div>
      </div>
      <div class="stat-box">
        <div class="stat-title">সংযুক্ত সময় (Uptime)</div>
        <div class="stat-val">$(uptime)</div>
      </div>
    </div>

    <div class="list-stats">
      <div class="row">
        <span class="row-label">আইপি এড্রেস</span>
        <span class="row-val">$(ip)</span>
      </div>
      <div class="row">
        <span class="row-label">ডাউনলোড / আপলোড</span>
        <span class="row-val" style="color:#38bdf8;">$(bytes-out-nice) ⬇ / $(bytes-in-nice) ⬆</span>
      </div>
      $(if remain-bytes-total)
      <div class="row">
        <span class="row-label">অবশিষ্ট ডাটা</span>
        <span class="row-val" style="color:#34d399;">$(remain-bytes-total-nice)</span>
      </div>
      $(endif)
    </div>

    <div class="btn-row">
      <a href="http://10.20.20.1/status" class="btn-refresh">🔄 রিফ্রেশ</a>
      <form action="$(link-logout)" method="post" style="flex:1;">
        <input type="hidden" name="erase-cookie" value="on">
        <button type="submit" class="btn-logout">সংযোগ বিচ্ছিন্ন ✕</button>
      </form>
    </div>

    <div class="footer">
      জরুরি হেল্পলাইন / সাপোর্ট: <br>
      <a href="tel:${phone}">📞 ${phone}</a>
      <div class="dev-credit">✨ ${credit}</div>
    </div>
  </div>

  <script>
    (function() {
      var rawEl = document.getElementById('rosRawTime');
      var raw = rawEl ? (rawEl.innerText || rawEl.textContent || '').trim() : '';

      var tGrid = document.getElementById('timerGrid');
      var unBox = document.getElementById('unlimitedBox');

      // If empty or variable untranslated
      if (!raw || raw.indexOf('$') !== -1 || raw === 'none' || raw === '0s') {
        if (tGrid) tGrid.style.display = 'none';
        if (unBox) unBox.style.display = 'block';
        return;
      }

      var totalSecs = 0;
      var wMatch = raw.match(/(\\d+)\\s*w/i);
      var dMatch = raw.match(/(\\d+)\\s*d/i);
      var hMatch = raw.match(/(\\d+)\\s*h/i);
      var mMatch = raw.match(/(\\d+)\\s*m/i);
      var sMatch = raw.match(/(\\d+)\\s*s/i);

      if (wMatch) totalSecs += parseInt(wMatch[1], 10) * 604800;
      if (dMatch) totalSecs += parseInt(dMatch[1], 10) * 86400;
      if (hMatch) totalSecs += parseInt(hMatch[1], 10) * 3600;
      if (mMatch) totalSecs += parseInt(mMatch[1], 10) * 60;
      if (sMatch) totalSecs += parseInt(sMatch[1], 10);

      var dEl = document.getElementById('tDays');
      var hEl = document.getElementById('tHours');
      var mEl = document.getElementById('tMins');
      var sEl = document.getElementById('tSecs');

      function pad(n) { return (n < 10 ? '0' : '') + n; }

      function renderTimer() {
        if (totalSecs <= 0) {
          if (dEl) dEl.innerText = '00';
          if (hEl) hEl.innerText = '00';
          if (mEl) mEl.innerText = '00';
          if (sEl) sEl.innerText = '00';
          return;
        }

        var days = Math.floor(totalSecs / 86400);
        var rem = totalSecs % 86400;
        var hours = Math.floor(rem / 3600);
        rem = rem % 3600;
        var mins = Math.floor(rem / 60);
        var secs = rem % 60;

        if (dEl) dEl.innerText = pad(days);
        if (hEl) hEl.innerText = pad(hours);
        if (mEl) mEl.innerText = pad(mins);
        if (sEl) sEl.innerText = pad(secs);
      }

      renderTimer();
      setInterval(function() {
        if (totalSecs > 0) {
          totalSecs--;
          renderTimer();
        }
      }, 1000);
    })();
  </script>
</body>
</html>`;
  }

  public static async pushTemplatesToRouter(settings: SystemSettings): Promise<boolean> {
    if (process.env.NODE_ENV === 'test') return true;

    try {
      const packages = Array.from(dbStore.packages.values());
      const loginHtml = this.generateLoginHtml(settings, packages);
      const statusHtml = this.generateStatusHtml(settings);

      const client = new RouterOSSocketClient({
        host: env.MIKROTIK_HOST,
        port: env.MIKROTIK_API_PORT,
        useSsl: env.MIKROTIK_API_SSL,
        username: env.MIKROTIK_USERNAME || 'admin',
        password: env.MIKROTIK_PASSWORD || 'admin',
        timeoutMs: 4000
      });

      await client.connect();

      // Find login.html
      const loginFiles = await client.write(['/file/print', '?name=flash/hotspot/login.html']);
      const loginFile = loginFiles.find(s => s.type === '!re');
      if (loginFile) {
        await client.write([
          '/file/set',
          `=.id=${loginFile.attributes['.id']}`,
          `=contents=${loginHtml}`
        ]);
      }

      // Find status.html
      const statusFiles = await client.write(['/file/print', '?name=flash/hotspot/status.html']);
      const statusFile = statusFiles.find(s => s.type === '!re');
      if (statusFile) {
        await client.write([
          '/file/set',
          `=.id=${statusFile.attributes['.id']}`,
          `=contents=${statusHtml}`
        ]);
      }

      await client.close();
      return true;
    } catch (err) {
      console.warn('Auto-sync portal template warning:', (err as Error).message);
      return false;
    }
  }
}

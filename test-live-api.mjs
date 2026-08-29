const BASE_URL = 'https://mikrotik-hotspot-management.onrender.com';

const results = [];

async function testApi(name, path, method = 'GET', body = undefined, token = undefined) {
  const start = Date.now();
  const url = `${BASE_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    const durationMs = Date.now() - start;
    let data;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    const isOk = res.status >= 200 && res.status < 300;
    results.push({
      name,
      endpoint: path,
      method,
      status: res.status,
      success: isOk,
      durationMs,
      details: isOk ? (typeof data === 'object' ? JSON.stringify(data).slice(0, 70) + '...' : 'Success (Non-JSON)') : JSON.stringify(data)
    });
    return data;
  } catch (err) {
    results.push({
      name,
      endpoint: path,
      method,
      status: 0,
      success: false,
      durationMs: Date.now() - start,
      details: err.message
    });
    return null;
  }
}

async function runAllTests() {
  console.log(`\n🔍 Live API Comprehensive Automated Test for: ${BASE_URL}\n`);

  // 1. Public Endpoints
  await testApi('Root Welcome Endpoint', '/');
  await testApi('System Health Check', '/health');
  await testApi('API Directory Index', '/api');

  // 2. Authentication
  const loginRes = await testApi('Admin User Login', '/api/auth/login', 'POST', {
    username: 'admin',
    password: 'Admin@1234'
  });

  const token = loginRes?.accessToken || loginRes?.data?.accessToken;

  if (token) {
    // 3. Authenticated Auth Profile
    await testApi('Current Admin Profile', '/api/auth/me', 'GET', undefined, token);

    // 4. Dashboard & Analytics
    await testApi('Dashboard Summary', '/api/dashboard/summary', 'GET', undefined, token);
    await testApi('Dashboard Traffic Rates', '/api/dashboard/traffic', 'GET', undefined, token);
    await testApi('Dashboard Sales Stats', '/api/dashboard/sales', 'GET', undefined, token);

    // 5. Billing Packages
    await testApi('List Billing Packages', '/api/packages', 'GET', undefined, token);
    await testApi('Create Billing Package', '/api/packages', 'POST', {
      name: `Test Pass ${Date.now().toString().slice(-3)}`,
      price: 25,
      durationMinutes: 180,
      downloadMbps: 10,
      uploadMbps: 5,
      sharedUsers: 1,
      validityMode: 'FROM_FIRST_LOGIN'
    }, token);

    // 6. Hotspot Users
    await testApi('List Hotspot Users', '/api/users', 'GET', undefined, token);
    await testApi('Create Hotspot User', '/api/users', 'POST', {
      username: `hs_user_${Date.now().toString().slice(-4)}`,
      password: 'userpass123',
      packageId: 'pkg-1h',
      comment: 'API Automated Verification User'
    }, token);

    // 7. Vouchers
    await testApi('List Hotspot Vouchers', '/api/vouchers', 'GET', undefined, token);
    await testApi('Export Vouchers CSV', '/api/vouchers/export/csv', 'GET', undefined, token);
    await testApi('Batch Generate Vouchers', '/api/vouchers/generate', 'POST', {
      packageId: 'pkg-1h',
      quantity: 5,
      comment: 'Batch Test'
    }, token);

    // 8. MikroTik Router Management
    await testApi('Router Live Status', '/api/mikrotik/status', 'GET', undefined, token);
    await testApi('Router Current Config', '/api/mikrotik/config', 'GET', undefined, token);

    // 9. Connector Agent Hub
    await testApi('List Active Connectors', '/api/connectors', 'GET', undefined, token);
    await testApi('Connector Command History', '/api/connectors/commands/history', 'GET', undefined, token);

    // 10. Reports & Analytics
    await testApi('Sales Report Overview', '/api/reports/sales?days=30', 'GET', undefined, token);
    await testApi('Export Sales CSV Report', '/api/reports/export/csv', 'GET', undefined, token);

    // 11. Diagnostics & System Settings
    await testApi('System Diagnostics Check', '/api/diagnostics', 'GET', undefined, token);
    await testApi('Audit Logs', '/api/audit-logs', 'GET', undefined, token);
    await testApi('System Settings', '/api/settings', 'GET', undefined, token);
  }

  console.log('\n========================================================================================');
  console.log('🏁 API TEST VERIFICATION SUMMARY REPORT');
  console.log('========================================================================================');
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    if (r.success) passed++; else failed++;
    console.log(`${icon} [${r.method.padEnd(4)}] ${r.endpoint.padEnd(35)} | Status: ${r.status} | ${r.durationMs}ms | ${r.name}`);
  }

  console.log('========================================================================================');
  console.log(`TOTAL ENDPOINTS TESTED: ${results.length} | PASSED: ${passed} | FAILED: ${failed} | SUCCESS RATE: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('========================================================================================\n');
}

runAllTests().catch(console.error);

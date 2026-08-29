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
      endpoint: path,
      method,
      status: res.status,
      success: isOk,
      durationMs,
      details: isOk ? (typeof data === 'object' ? JSON.stringify(data).slice(0, 80) + '...' : 'Success (Non-JSON)') : JSON.stringify(data)
    });
    return data;
  } catch (err) {
    results.push({
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
  console.log(`\n🔍 Starting Comprehensive Live API Verification for: ${BASE_URL}\n`);

  // 1. Public Endpoints
  await testApi('Root Welcome', '/');
  await testApi('Health Check', '/health');
  await testApi('API Index', '/api');

  // 2. Authentication
  const loginRes = await testApi('Admin Login', '/api/auth/login', 'POST', {
    username: 'admin',
    password: 'Admin@1234'
  });

  const token = loginRes?.accessToken || loginRes?.data?.accessToken;
  console.log(`🔑 Login Result: ${token ? 'SUCCESS (Token Acquired)' : 'FAILED'}`);

  if (token) {
    // 3. Authenticated Auth Profile
    await testApi('Get My Profile', '/api/auth/me', 'GET', undefined, token);

    // 4. Dashboard Summary
    await testApi('Dashboard Summary', '/api/dashboard', 'GET', undefined, token);
    await testApi('Dashboard Stats', '/api/dashboard/stats', 'GET', undefined, token);

    // 5. Packages
    await testApi('List Packages', '/api/packages', 'GET', undefined, token);
    await testApi('Create Package', '/api/packages', 'POST', {
      name: 'Test Fast Pass 2h',
      price: 20,
      durationMinutes: 120,
      downloadMbps: 10,
      uploadMbps: 5,
      sharedUsers: 1,
      validityMode: 'FROM_FIRST_LOGIN'
    }, token);

    // 6. Users
    await testApi('List Users', '/api/users', 'GET', undefined, token);
    await testApi('Create User', '/api/users', 'POST', {
      username: `testuser_${Date.now().toString().slice(-4)}`,
      password: 'password123',
      packageId: 'pkg-1h',
      comment: 'API Automated Test User'
    }, token);

    // 7. Vouchers
    await testApi('List Vouchers', '/api/vouchers', 'GET', undefined, token);
    await testApi('Voucher Stats', '/api/vouchers/stats', 'GET', undefined, token);
    await testApi('Batch Generate Vouchers', '/api/vouchers/generate', 'POST', {
      packageId: 'pkg-1h',
      quantity: 3,
      comment: 'Batch Test'
    }, token);

    // 8. MikroTik Router Management
    await testApi('Router Status', '/api/mikrotik/status', 'GET', undefined, token);
    await testApi('Router Config', '/api/mikrotik/config', 'GET', undefined, token);

    // 9. Connectors
    await testApi('List Connectors', '/api/connectors', 'GET', undefined, token);
    await testApi('Connector Command History', '/api/connectors/commands/history', 'GET', undefined, token);

    // 10. Reports
    await testApi('Sales Report (default)', '/api/reports', 'GET', undefined, token);
    await testApi('Sales Report (30 days)', '/api/reports/sales?days=30', 'GET', undefined, token);
    await testApi('Export Sales CSV', '/api/reports/export/csv', 'GET', undefined, token);

    // 11. Diagnostics
    await testApi('System Diagnostics', '/api/diagnostics/ping', 'GET', undefined, token);
  }

  console.log('\n========================================================================================');
  console.log('🏁 API TEST VERIFICATION SUMMARY REPORT');
  console.log('========================================================================================');
  let passed = 0;
  let failed = 0;

  for (const r of results) {
    const icon = r.success ? '✅' : '❌';
    if (r.success) passed++; else failed++;
    console.log(`${icon} [${r.method.padEnd(4)}] ${r.endpoint.padEnd(35)} | Status: ${r.status} | ${r.durationMs}ms | ${r.details}`);
  }

  console.log('========================================================================================');
  console.log(`TOTAL ENDPOINTS TESTED: ${results.length} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('========================================================================================\n');
}

runAllTests().catch(console.error);

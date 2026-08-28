import { describe, it, expect } from 'vitest';
import { MockMikroTikAdapter } from '../src/adapters/mikrotik/mock.adapter.js';

describe('MockMikroTikAdapter (Simulated RouterOS 7.24.1)', () => {
  const adapter = new MockMikroTikAdapter();

  it('should report realistic RB951Ui-2HnD hardware specs', async () => {
    const res = await adapter.getResources();
    expect(res.boardName).toBe('RB951Ui-2HnD');
    expect(res.version).toContain('7.24.1');
    expect(res.totalMemory).toBe(128 * 1024 * 1024);
    expect(res.freeMemory).toBeGreaterThan(0);
  });

  it('should list existing networks without tampering (PPPoE ISP, SSTP REEMOTE_ACCESS, bridge-hotspot)', async () => {
    const interfaces = await adapter.getInterfaces();
    const names = interfaces.map(i => i.name);
    expect(names).toContain('ISP');
    expect(names).toContain('REEMOTE_ACCESS');
    expect(names).toContain('bridge-hotspot');
  });

  it('should handle Hotspot user lifecycle in memory safely', async () => {
    const created = await adapter.createHotspotUser({
      name: 'test_student_01',
      password: 'password123',
      profile: 'HS-5M',
      comment: 'Vitest Automated Creation'
    });
    expect(created.name).toBe('test_student_01');

    const users = await adapter.getHotspotUsers();
    const found = users.find(u => u.name === 'test_student_01');
    expect(found).toBeDefined();
    expect(found?.disabled).toBe(false);

    await adapter.disableHotspotUser('test_student_01');
    const updatedUsers = await adapter.getHotspotUsers();
    expect(updatedUsers.find(u => u.name === 'test_student_01')?.disabled).toBe(true);

    await adapter.deleteHotspotUser('test_student_01');
    const finalUsers = await adapter.getHotspotUsers();
    expect(finalUsers.find(u => u.name === 'test_student_01')).toBeUndefined();
  });
});

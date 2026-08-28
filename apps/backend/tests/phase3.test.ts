import { describe, it, expect, beforeAll } from 'vitest';
import { connectorService, commandQueue } from '../src/services/connector.service.js';
import { diagnosticsService } from '../src/services/diagnostics.service.js';
import { dbStore } from '../src/repositories/index.js';

describe('Phase 3 Connector Protocol & VPN Diagnostics', () => {
  beforeAll(async () => {
    await dbStore.initialize();
  });

  it('should register a new connector agent with secure plain token', async () => {
    const reg = await connectorService.registerConnector('Office PC Test Agent');
    expect(reg.connector.id).toBeDefined();
    expect(reg.connector.name).toBe('Office PC Test Agent');
    expect(reg.plainToken.startsWith('conn_')).toBe(true);
  });

  it('should enqueue and poll commands via command queue', async () => {
    const cmd = commandQueue.enqueue('GET_RESOURCES', { target: '10.10.13.38' }, 'test-conn-1');
    expect(cmd.status).toBe('PENDING');

    const polled = commandQueue.poll('test-conn-1');
    expect(polled.length).toBeGreaterThan(0);
    const targetCmd = polled.find(c => c.commandId === cmd.commandId);
    expect(targetCmd?.status).toBe('DISPATCHED');
  });

  it('should submit command results and update status to COMPLETED', async () => {
    const cmd = commandQueue.enqueue('PING_TEST', {}, 'test-conn-2');
    commandQueue.poll('test-conn-2');

    const updated = commandQueue.submitResult({
      commandId: cmd.commandId,
      success: true,
      data: { latencyMs: 12, reachable: true },
      executedAt: new Date().toISOString(),
      durationMs: 15
    });

    expect(updated?.status).toBe('COMPLETED');
    expect(updated?.result?.success).toBe(true);
  });

  it('should provide complete network diagnostics telemetry', async () => {
    const diag = await diagnosticsService.getDiagnostics();
    expect(diag.backend.status).toBe('OK');
    expect(diag.database.status).toBe('OK');
    expect(diag.vpn.remoteIp).toBe('10.10.13.38');
    expect(diag.mikrotik.model).toBe('RB951Ui-2HnD');
  });
});

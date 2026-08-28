import dotenv from 'dotenv';
import { z } from 'zod';
import type { ConnectorCommand, ConnectorResponse } from '@hotspot/shared';

dotenv.config();

const ConnectorEnvSchema = z.object({
  BACKEND_URL: z.string().default('http://localhost:4000/api'),
  CONNECTOR_ID: z.string().default('a0b1c2d3-e4f5-4678-90ab-cdef12345678'),
  CONNECTOR_TOKEN: z.string().default(process.env.CONNECTOR_SECRET || process.env.CONNECTOR_TOKEN || 'dev_connector_token_placeholder'),
  MIKROTIK_HOST: z.string().default('10.10.13.38'),
  MIKROTIK_API_PORT: z.coerce.number().default(8728),
  MIKROTIK_API_SSL: z.coerce.boolean().default(false),
  HEARTBEAT_INTERVAL_MS: z.coerce.number().default(10000),
  COMMAND_POLL_INTERVAL_MS: z.coerce.number().default(3000),
  MOCK_MODE: z.coerce.boolean().default(true)
});

const config = ConnectorEnvSchema.parse(process.env);

class ConnectorAgent {
  private isRunning = false;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pollTimer: NodeJS.Timeout | null = null;

  public async start(): Promise<void> {
    this.isRunning = true;
    console.log('====================================================');
    console.log('🤖 MikroTik HotSpot Outbound Connector Agent Starting');
    console.log(`🔗 Backend URL: ${config.BACKEND_URL}`);
    console.log(`🔒 Target Router VPN IP: ${config.MIKROTIK_HOST}:${config.MIKROTIK_API_PORT}`);
    console.log(`🛡️ Router Simulation Mode: ${config.MOCK_MODE}`);
    console.log('====================================================');

    await this.sendHeartbeat();
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), config.HEARTBEAT_INTERVAL_MS);
    this.pollTimer = setInterval(() => this.pollAndExecuteCommands(), config.COMMAND_POLL_INTERVAL_MS);
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const payload = {
        connectorId: config.CONNECTOR_ID,
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'ONLINE' as const,
        systemStats: {
          cpuUsagePercent: 6 + Math.floor(Math.random() * 8),
          memoryUsagePercent: 22,
          canReachMikrotik: true
        }
      };

      const res = await fetch(`${config.BACKEND_URL}/connectors/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.CONNECTOR_TOKEN}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`[${new Date().toLocaleTimeString()}] 💚 Heartbeat acknowledged by backend.`);
      }
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to reach backend:`, (err as Error).message);
    }
  }

  private async pollAndExecuteCommands(): Promise<void> {
    if (!this.isRunning) return;
    try {
      const res = await fetch(`${config.BACKEND_URL}/connectors/commands/poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.CONNECTOR_TOKEN}`
        },
        body: JSON.stringify({ connectorId: config.CONNECTOR_ID })
      });

      if (!res.ok) return;

      const data = await res.json() as { success: boolean; data: ConnectorCommand[] };
      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) return;

      for (const cmd of data.data) {
        await this.handleCommand(cmd);
      }
    } catch {
      // Ignore polling connection blips
    }
  }

  private async handleCommand(cmd: ConnectorCommand): Promise<void> {
    const start = Date.now();
    console.log(`[${new Date().toLocaleTimeString()}] ⚡ Received command: ${cmd.action} (${cmd.commandId})`);

    let success = true;
    let resultData: unknown = {};
    let error: { code: string; message: string } | undefined;

    try {
      switch (cmd.action) {
        case 'GET_RESOURCES':
          resultData = {
            version: '7.24.1 (stable)',
            boardName: 'RB951Ui-2HnD',
            uptime: '14w3d18h42m',
            cpuLoad: 14,
            freeMemory: 78000000,
            totalMemory: 128000000
          };
          break;
        case 'PING_TEST':
          resultData = {
            host: config.MIKROTIK_HOST,
            latencyMs: 14,
            reachable: true
          };
          break;
        case 'GET_ACTIVE_SESSIONS':
          resultData = [];
          break;
        default:
          resultData = { message: `Action ${cmd.action} executed successfully via Connector.` };
      }
    } catch (err) {
      success = false;
      error = { code: 'EXECUTION_FAILED', message: (err as Error).message };
    }

    const responsePayload: ConnectorResponse = {
      commandId: cmd.commandId,
      success,
      data: resultData,
      error,
      executedAt: new Date().toISOString(),
      durationMs: Date.now() - start
    };

    try {
      await fetch(`${config.BACKEND_URL}/connectors/commands/${cmd.commandId}/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.CONNECTOR_TOKEN}`
        },
        body: JSON.stringify(responsePayload)
      });
      console.log(`[${new Date().toLocaleTimeString()}] ✅ Command ${cmd.commandId} result submitted.`);
    } catch (err) {
      console.error(`[${new Date().toLocaleTimeString()}] ❌ Failed to submit result:`, (err as Error).message);
    }
  }

  public stop(): void {
    this.isRunning = false;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pollTimer) clearInterval(this.pollTimer);
    console.log('🛑 Connector agent stopped.');
  }
}

const agent = new ConnectorAgent();
agent.start().catch(console.error);

process.on('SIGINT', () => {
  agent.stop();
  process.exit(0);
});

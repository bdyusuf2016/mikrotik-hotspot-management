import crypto from 'crypto';
import { dbStore, type ConnectorRecord } from '../repositories/index.js';
import { hashToken } from '../core/security.js';
import { NotFoundError } from '../core/errors.js';
import type {
  ConnectorHeartbeatInput,
  ConnectorStatus,
  ConnectorCommand,
  ConnectorResponse,
  ConnectorAction
} from '@hotspot/shared';

class ConnectorCommandQueue {
  private commands: Map<string, ConnectorCommand> = new Map();
  private pendingQueue: string[] = [];

  public enqueue<T>(action: ConnectorAction, payload: T, connectorId?: string, timeoutMs = 15000): ConnectorCommand<T> {
    const commandId = `cmd-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const cmd: ConnectorCommand<T> = {
      commandId,
      connectorId,
      action,
      payload,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
      timeoutMs
    };
    this.commands.set(commandId, cmd as unknown as ConnectorCommand);
    this.pendingQueue.push(commandId);
    return cmd;
  }

  public poll(connectorId?: string): ConnectorCommand[] {
    const now = new Date().toISOString();
    const fetched: ConnectorCommand[] = [];

    const remaining: string[] = [];
    for (const cmdId of this.pendingQueue) {
      const cmd = this.commands.get(cmdId);
      if (!cmd) continue;
      if (!cmd.connectorId || cmd.connectorId === connectorId) {
        cmd.status = 'DISPATCHED';
        cmd.dispatchedAt = now;
        fetched.push(cmd);
      } else {
        remaining.push(cmdId);
      }
    }
    this.pendingQueue = remaining;
    return fetched;
  }

  public submitResult(response: ConnectorResponse): ConnectorCommand | undefined {
    const cmd = this.commands.get(response.commandId);
    if (!cmd) return undefined;
    cmd.status = response.success ? 'COMPLETED' : 'FAILED';
    cmd.completedAt = new Date().toISOString();
    cmd.result = response;
    return cmd;
  }

  public getHistory(limit = 20): ConnectorCommand[] {
    return Array.from(this.commands.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const commandQueue = new ConnectorCommandQueue();

export class ConnectorService {
  async getAllConnectors(): Promise<ConnectorRecord[]> {
    await dbStore.initialize();
    return Array.from(dbStore.connectors.values());
  }

  async registerConnector(name: string): Promise<{ connector: ConnectorRecord; plainToken: string }> {
    await dbStore.initialize();
    const rawToken = `conn_${crypto.randomBytes(24).toString('hex')}`;
    const tokenHash = hashToken(rawToken);

    const connector: ConnectorRecord = {
      id: `conn-${Date.now()}`,
      name,
      tokenHash,
      status: 'OFFLINE',
      version: '1.0.0',
      lastSeenAt: null,
      createdAt: new Date().toISOString()
    };

    dbStore.connectors.set(connector.id, connector);
    dbStore.logAudit({
      action: 'CONNECTOR_REGISTERED',
      entity: 'Connector',
      entityId: connector.id,
      metadata: { name }
    });

    return {
      connector,
      plainToken: rawToken
    };
  }

  async handleHeartbeat(input: ConnectorHeartbeatInput, ipAddress?: string): Promise<{ acknowledged: boolean; serverTime: string; pendingCommandsCount: number }> {
    await dbStore.initialize();
    const existing = dbStore.connectors.get(input.connectorId);
    const status: ConnectorStatus = input.status === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';

    if (!existing) {
      const newConnector: ConnectorRecord = {
        id: input.connectorId,
        name: `Connector Agent (${ipAddress || 'VPN'})`,
        tokenHash: 'auto-generated',
        status,
        version: input.version,
        lastSeenAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      dbStore.connectors.set(newConnector.id, newConnector);
    } else {
      existing.status = status;
      existing.version = input.version;
      existing.lastSeenAt = new Date().toISOString();
      dbStore.connectors.set(input.connectorId, existing);
    }

    const pending = commandQueue.poll(input.connectorId);

    return {
      acknowledged: true,
      serverTime: new Date().toISOString(),
      pendingCommandsCount: pending.length
    };
  }

  async pollCommands(connectorId: string): Promise<ConnectorCommand[]> {
    return commandQueue.poll(connectorId);
  }

  async submitCommandResult(response: ConnectorResponse): Promise<{ success: boolean }> {
    const updated = commandQueue.submitResult(response);
    return { success: !!updated };
  }

  async getCommandHistory(limit = 20): Promise<ConnectorCommand[]> {
    return commandQueue.getHistory(limit);
  }

  async revokeConnector(id: string): Promise<boolean> {
    await dbStore.initialize();
    const connector = dbStore.connectors.get(id);
    if (!connector) throw new NotFoundError('Connector not found');
    connector.status = 'REVOKED';
    dbStore.connectors.set(id, connector);

    dbStore.logAudit({
      action: 'CONNECTOR_REVOKED',
      entity: 'Connector',
      entityId: id
    });

    return true;
  }

  async rotateToken(id: string): Promise<{ newPlainToken: string }> {
    await dbStore.initialize();
    const connector = dbStore.connectors.get(id);
    if (!connector) throw new NotFoundError('Connector not found');

    const newRawToken = `conn_${crypto.randomBytes(24).toString('hex')}`;
    connector.tokenHash = hashToken(newRawToken);
    dbStore.connectors.set(id, connector);

    dbStore.logAudit({
      action: 'CONNECTOR_TOKEN_ROTATED',
      entity: 'Connector',
      entityId: id
    });

    return { newPlainToken: newRawToken };
  }
}

export const connectorService = new ConnectorService();

import type {
  IMikroTikAdapter,
  MikroTikUserConfig,
  MikroTikProfileConfig
} from './interface.js';
import type {
  ActiveSession,
  RouterStatus,
  MikroTikResourceData
} from '@hotspot/shared';

interface InternalMockUser {
  id: string;
  name: string;
  password?: string;
  profile: string;
  macAddress?: string;
  ipAddress?: string;
  comment?: string;
  disabled: boolean;
  bytesIn: number;
  bytesOut: number;
  uptime: number;
}

export class MockMikroTikAdapter implements IMikroTikAdapter {
  private users: Map<string, InternalMockUser> = new Map();
  private activeSessions: Map<string, ActiveSession> = new Map();
  private profiles: Map<string, MikroTikProfileConfig> = new Map();

  constructor() {
    this.seedInitialState();
  }

  private seedInitialState(): void {
    // Seed standard profiles
    const defaultProfiles: MikroTikProfileConfig[] = [
      { name: 'default', rateLimit: '2M/2M', sharedUsers: 1 },
      { name: 'HS-1M', rateLimit: '1M/1M', sharedUsers: 1, sessionTimeout: '1d', idleTimeout: '5m' },
      { name: 'HS-2M', rateLimit: '2M/2M', sharedUsers: 1, sessionTimeout: '3d', idleTimeout: '5m' },
      { name: 'HS-5M', rateLimit: '5M/2M', sharedUsers: 1, sessionTimeout: '7d', idleTimeout: '10m' },
      { name: 'HS-10M', rateLimit: '10M/5M', sharedUsers: 2, sessionTimeout: '30d', idleTimeout: '15m' }
    ];
    for (const prof of defaultProfiles) {
      this.profiles.set(prof.name, prof);
    }
  }

  async testConnection(): Promise<{ reachable: boolean; authenticated: boolean; latencyMs: number }> {
    return {
      reachable: true,
      authenticated: true,
      latencyMs: 12
    };
  }

  async getResources(): Promise<MikroTikResourceData> {
    const totalMem = 128 * 1024 * 1024; // 128 MB RB951Ui-2HnD
    const freeMem = 78 * 1024 * 1024 + Math.floor(Math.random() * 4000000);
    const totalHdd = 128 * 1024 * 1024;
    const freeHdd = 104 * 1024 * 1024;

    return {
      uptime: '14w3d18h42m',
      version: '7.24.1 (stable)',
      buildTime: '2026-08-10 11:24:00',
      freeMemory: freeMem,
      totalMemory: totalMem,
      cpu: 'MIPS 24Kc V7.4',
      cpuCount: 1,
      cpuFrequency: 600,
      cpuLoad: 12 + Math.floor(Math.random() * 15),
      freeHddSpace: freeHdd,
      totalHddSpace: totalHdd,
      architectureName: 'mipsbe',
      boardName: 'RB951Ui-2HnD',
      platform: 'MikroTik'
    };
  }

  async getRouterStatus(): Promise<RouterStatus> {
    const res = await this.getResources();
    return {
      identity: 'MikroTik-HotSpot-RB951',
      version: res.version,
      model: res.boardName,
      cpuLoad: res.cpuLoad,
      freeMemoryMB: Math.round(res.freeMemory / (1024 * 1024)),
      totalMemoryMB: Math.round(res.totalMemory / (1024 * 1024)),
      freeHddMB: Math.round(res.freeHddSpace / (1024 * 1024)),
      totalHddMB: Math.round(res.totalHddSpace / (1024 * 1024)),
      uptime: res.uptime,
      boardName: res.boardName,
      connectionMode: 'MOCK',
      isReachable: true,
      apiConnected: true,
      vpnConnected: true,
      lastCheckedAt: new Date().toISOString()
    };
  }

  async getInterfaces(): Promise<Array<{ name: string; type: string; running: boolean; rxByte: number; txByte: number; comment?: string }>> {
    return [
      { name: 'ISP', type: 'pppoe-out', running: true, rxByte: 18452093400, txByte: 8329480100, comment: 'Primary PPPoE Connection' },
      { name: 'REEMOTE_ACCESS', type: 'sstp-out', running: true, rxByte: 24890012, txByte: 18490230, comment: 'CloudMikroTik VPN 10.10.13.38' },
      { name: 'bridge-hotspot', type: 'bridge', running: true, rxByte: 12948019340, txByte: 28490192340, comment: 'HotSpot Network 10.20.20.1/24' },
      { name: 'ether1-gateway', type: 'ether', running: true, rxByte: 18500200100, txByte: 8400100200, comment: 'WAN Physical' },
      { name: 'ether2-lan', type: 'ether', running: true, rxByte: 948010200, txByte: 1240010200, comment: 'Office LAN 192.168.10.1/24' },
      { name: 'wlan1', type: 'wlan', running: true, rxByte: 12900100200, txByte: 28300200100, comment: '2.4GHz Wireless AP' }
    ];
  }

  async getHotspotUsers(): Promise<Array<{ id: string; name: string; profile: string; comment?: string; disabled: boolean; uptime?: string; bytesIn?: number; bytesOut?: number }>> {
    return Array.from(this.users.values()).map(u => ({
      id: u.id,
      name: u.name,
      profile: u.profile,
      comment: u.comment,
      disabled: u.disabled,
      uptime: `${Math.floor(u.uptime / 3600)}h ${Math.floor((u.uptime % 3600) / 60)}m`,
      bytesIn: u.bytesIn,
      bytesOut: u.bytesOut
    }));
  }

  async createHotspotUser(user: MikroTikUserConfig): Promise<{ id: string; name: string }> {
    if (this.users.has(user.name)) {
      throw new Error(`User ${user.name} already exists in MikroTik.`);
    }
    const id = `*${(this.users.size + 20).toString(16)}`;
    this.users.set(user.name, {
      id,
      name: user.name,
      password: user.password,
      profile: user.profile || 'default',
      macAddress: user.macAddress,
      ipAddress: user.ipAddress,
      comment: user.comment,
      disabled: !!user.disabled,
      bytesIn: 0,
      bytesOut: 0,
      uptime: 0
    });
    return { id, name: user.name };
  }

  async updateHotspotUser(name: string, updates: Partial<MikroTikUserConfig>): Promise<boolean> {
    const existing = this.users.get(name);
    if (!existing) return false;
    this.users.set(name, {
      ...existing,
      ...updates,
      name
    });
    return true;
  }

  async deleteHotspotUser(name: string): Promise<boolean> {
    this.activeSessions.delete(name);
    return this.users.delete(name);
  }

  async enableHotspotUser(name: string): Promise<boolean> {
    const u = this.users.get(name);
    if (!u) return false;
    u.disabled = false;
    return true;
  }

  async disableHotspotUser(name: string): Promise<boolean> {
    const u = this.users.get(name);
    if (!u) return false;
    u.disabled = true;
    this.activeSessions.delete(name);
    return true;
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async disconnectSession(sessionIdOrUsername: string): Promise<boolean> {
    for (const [username, session] of this.activeSessions.entries()) {
      if (username === sessionIdOrUsername || session.id === sessionIdOrUsername) {
        this.activeSessions.delete(username);
        return true;
      }
    }
    return false;
  }

  async getUserProfiles(): Promise<Array<{ id: string; name: string; rateLimit?: string; sharedUsers?: number }>> {
    return Array.from(this.profiles.values()).map((p, idx) => ({
      id: `*p${idx + 1}`,
      name: p.name,
      rateLimit: p.rateLimit,
      sharedUsers: p.sharedUsers
    }));
  }

  async createUserProfile(profile: MikroTikProfileConfig): Promise<boolean> {
    this.profiles.set(profile.name, profile);
    return true;
  }

  async getServerProfile(_name?: string) {
    return {
      id: '*1',
      name: 'hsprof1',
      hotspotAddress: '10.20.20.1',
      dnsName: 'login.hotspot',
      htmlDirectory: 'flash/hotspot',
      loginBy: ['cookie', 'http-chap', 'http-pap', 'mac-cookie'],
      httpCookieLifetime: '3d',
      useRadius: false
    };
  }

  async updateServerProfile(_updates: any, _name?: string): Promise<boolean> {
    return true;
  }

  async getTrafficRates(_interfaceName?: string): Promise<{ downloadMbps: number; uploadMbps: number; activeUsers: number }> {
    return {
      downloadMbps: 0,
      uploadMbps: 0,
      activeUsers: this.activeSessions.size
    };
  }
}

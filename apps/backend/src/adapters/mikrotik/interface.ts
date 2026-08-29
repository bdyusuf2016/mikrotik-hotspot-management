import type {
  ActiveSession,
  RouterStatus,
  MikroTikResourceData
} from '@hotspot/shared';

export interface MikroTikUserConfig {
  name: string;
  password?: string;
  profile: string;
  macAddress?: string;
  ipAddress?: string;
  comment?: string;
  disabled?: boolean;
  limitUptime?: string; // e.g. "1d", "7d", "30d" or "86400s"
  limitBytesTotal?: number;
}

export interface MikroTikProfileConfig {
  name: string;
  rateLimit: string; // e.g. "5M/2M"
  sharedUsers?: number;
  sessionTimeout?: string; // e.g. "none" or "1d"
  idleTimeout?: string;    // e.g. "5m"
  keepaliveTimeout?: string;
  statusAutorefresh?: string;
}

export interface HotspotServerProfileConfig {
  id?: string;
  name: string;
  hotspotAddress?: string;
  dnsName?: string;
  htmlDirectory?: string;
  loginBy: string[];
  httpCookieLifetime?: string;
  useRadius?: boolean;
}

export interface IMikroTikAdapter {
  testConnection(): Promise<{ reachable: boolean; authenticated: boolean; latencyMs: number; error?: string }>;
  getResources(): Promise<MikroTikResourceData>;
  getRouterStatus(): Promise<RouterStatus>;
  getInterfaces(): Promise<Array<{ name: string; type: string; running: boolean; rxByte: number; txByte: number; comment?: string }>>;
  getHotspotUsers(): Promise<Array<{ id: string; name: string; password?: string; profile: string; comment?: string; disabled: boolean; uptime?: string; bytesIn?: number; bytesOut?: number; limitUptime?: string }>>;
  createHotspotUser(user: MikroTikUserConfig): Promise<{ id: string; name: string }>;
  updateHotspotUser(name: string, updates: Partial<MikroTikUserConfig>): Promise<boolean>;
  deleteHotspotUser(name: string): Promise<boolean>;
  enableHotspotUser(name: string): Promise<boolean>;
  disableHotspotUser(name: string): Promise<boolean>;
  getActiveSessions(): Promise<ActiveSession[]>;
  disconnectSession(sessionIdOrUsername: string): Promise<boolean>;
  getUserProfiles(): Promise<Array<{ id: string; name: string; rateLimit?: string; sharedUsers?: number }>>;
  createUserProfile(profile: MikroTikProfileConfig): Promise<boolean>;
  getServerProfile(name?: string): Promise<HotspotServerProfileConfig>;
  updateServerProfile(updates: Partial<HotspotServerProfileConfig>, name?: string): Promise<boolean>;
  getTrafficRates(interfaceName?: string): Promise<{ downloadMbps: number; uploadMbps: number; activeUsers: number }>;
}

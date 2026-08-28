import { env } from '../../config/env.js';
import type { IMikroTikAdapter } from './interface.js';
import { MockMikroTikAdapter } from './mock.adapter.js';
import { DirectMikroTikAdapter } from './direct.adapter.js';
import { ConnectorMikroTikAdapter } from './connector.adapter.js';

export interface ActiveRouterConnectionConfig {
  host: string;
  port: number;
  useSsl: boolean;
  username: string;
  password?: string;
  connectionMode: 'BACKEND_DIRECT_VPN' | 'CONNECTOR_AGENT' | 'MOCK';
  sstpServerHost?: string;
  sstpUsername?: string;
  sstpPassword?: string;
}

class MikroTikAdapterFactory {
  private static mockInstance: MockMikroTikAdapter | null = null;
  private static directInstance: DirectMikroTikAdapter | null = null;
  
  private static currentConfig: ActiveRouterConnectionConfig = {
    host: env.MIKROTIK_HOST || '10.10.13.38',
    port: env.MIKROTIK_API_PORT || 8728,
    useSsl: env.MIKROTIK_API_SSL || false,
    username: env.MIKROTIK_USERNAME || 'admin',
    password: env.MIKROTIK_PASSWORD || 'admin',
    connectionMode: (env.MIKROTIK_CONNECTION_MODE as any) || 'BACKEND_DIRECT_VPN',
    sstpServerHost: 'vpn.hotspot.local',
    sstpUsername: 'router-client-1',
    sstpPassword: 'vpnpassword123'
  };

  public static getCurrentConfig(): ActiveRouterConnectionConfig {
    return { ...this.currentConfig };
  }

  public static setRouterConfig(config: Partial<ActiveRouterConnectionConfig>): void {
    this.currentConfig = {
      ...this.currentConfig,
      ...config
    };
    // Invalidate direct instance to reconnect with new config on next query
    this.directInstance = null;
  }

  public static getAdapter(activeConnectorCountSupplier: () => number = () => 0): IMikroTikAdapter {
    if (env.NODE_ENV === 'test' || this.currentConfig.connectionMode === 'MOCK') {
      if (!this.mockInstance) {
        this.mockInstance = new MockMikroTikAdapter();
      }
      return this.mockInstance;
    }

    if (this.currentConfig.connectionMode === 'BACKEND_DIRECT_VPN') {
      if (!this.directInstance) {
        this.directInstance = new DirectMikroTikAdapter({
          host: this.currentConfig.host,
          port: this.currentConfig.port,
          useSsl: this.currentConfig.useSsl,
          username: this.currentConfig.username,
          password: this.currentConfig.password || 'admin'
        });
      }
      return this.directInstance;
    }

    if (this.currentConfig.connectionMode === 'CONNECTOR_AGENT') {
      return new ConnectorMikroTikAdapter(activeConnectorCountSupplier);
    }

    if (!this.mockInstance) {
      this.mockInstance = new MockMikroTikAdapter();
    }
    return this.mockInstance;
  }
}

export { MikroTikAdapterFactory };

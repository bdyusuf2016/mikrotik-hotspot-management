import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { STANDARD_PROFILES } from '@hotspot/shared';

export interface SpeedProfileItem {
  name: string;
  rateLimit: string;
  downloadMbps: number;
  uploadMbps: number;
  sharedUsers: number;
  sessionTimeout: string;
  idleTimeout: string;
}

export class ProfileService {
  private getAdapter() {
    return MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);
  }

  public getStandardProfiles(): SpeedProfileItem[] {
    return [
      { name: 'HS-1M', rateLimit: '1M/1M', downloadMbps: 1, uploadMbps: 1, sharedUsers: 1, sessionTimeout: '1d', idleTimeout: '5m' },
      { name: 'HS-2M', rateLimit: '2M/2M', downloadMbps: 2, uploadMbps: 2, sharedUsers: 1, sessionTimeout: '3d', idleTimeout: '5m' },
      { name: 'HS-5M', rateLimit: '5M/2M', downloadMbps: 5, uploadMbps: 2, sharedUsers: 1, sessionTimeout: '7d', idleTimeout: '10m' },
      { name: 'HS-8M', rateLimit: '8M/3M', downloadMbps: 8, uploadMbps: 3, sharedUsers: 1, sessionTimeout: '15d', idleTimeout: '10m' },
      { name: 'HS-10M', rateLimit: '10M/5M', downloadMbps: 10, uploadMbps: 5, sharedUsers: 2, sessionTimeout: '30d', idleTimeout: '15m' }
    ];
  }

  public async syncProfilesToRouter(adminUsername = 'admin'): Promise<{ syncedCount: number; profiles: SpeedProfileItem[] }> {
    const mikrotik = this.getAdapter();
    const profiles = this.getStandardProfiles();

    for (const p of profiles) {
      await mikrotik.createUserProfile({
        name: p.name,
        rateLimit: p.rateLimit,
        sharedUsers: p.sharedUsers,
        sessionTimeout: p.sessionTimeout,
        idleTimeout: p.idleTimeout
      });
    }

    dbStore.logAudit({
      adminUsername,
      action: 'SPEED_PROFILES_SYNCED',
      entity: 'MikroTikProfile',
      metadata: { profileCount: profiles.length }
    });

    return {
      syncedCount: profiles.length,
      profiles
    };
  }
}

export const profileService = new ProfileService();

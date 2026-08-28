import { describe, it, expect, beforeAll } from 'vitest';
import { expiryService } from '../src/services/expiry.service.js';
import { profileService } from '../src/services/profile.service.js';
import { userService } from '../src/services/user.service.js';
import { dbStore } from '../src/repositories/index.js';

describe('Phase 4 Account Expiry, Speed Profiles & Traffic Analytics', () => {
  beforeAll(async () => {
    await dbStore.initialize();
  });

  it('should scan and disable expired accounts during sweep', async () => {
    // Create an account with past expiration
    const expiredUser = await userService.createUser({
      username: 'expired_auto_test',
      password: 'pass123',
      packageId: 'pkg-1d'
    });

    // Artificially set expiresAt in the past
    expiredUser.expiresAt = new Date(Date.now() - 3600000).toISOString();
    dbStore.users.set(expiredUser.id, expiredUser);

    const sweep = await expiryService.runExpirySweep('EXPIRY_UNIT_TEST');
    expect(sweep.checkedCount).toBeGreaterThan(0);
    expect(sweep.expiredCount).toBeGreaterThanOrEqual(1);

    const updatedUser = dbStore.users.get(expiredUser.id);
    expect(updatedUser?.status).toBe('EXPIRED');

    const audit = dbStore.auditLogs.find(a => a.action === 'ACCOUNT_EXPIRED' && a.entityId === expiredUser.id);
    expect(audit).toBeDefined();
  });

  it('should list all standard speed profiles', () => {
    const profiles = profileService.getStandardProfiles();
    expect(profiles.length).toBe(5);
    const names = profiles.map(p => p.name);
    expect(names).toContain('HS-1M');
    expect(names).toContain('HS-5M');
    expect(names).toContain('HS-10M');
  });

  it('should synchronize speed profiles to router and record audit log', async () => {
    const result = await profileService.syncProfilesToRouter('test_admin');
    expect(result.syncedCount).toBe(5);

    const audit = dbStore.auditLogs.find(a => a.action === 'SPEED_PROFILES_SYNCED');
    expect(audit).toBeDefined();
  });
});

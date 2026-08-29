import { dbStore } from '../repositories/index.js';
import { MikroTikAdapterFactory } from '../adapters/mikrotik/factory.js';
import { ConflictError, NotFoundError } from '../core/errors.js';
import type { HotspotUserCreateInput, HotspotUserUpdateInput } from '@hotspot/shared';
import type { HotspotUser } from '@hotspot/shared';

function getRouterLimitUptime(durationMinutes: number): string {
  if (!durationMinutes || durationMinutes <= 0) return '1d';
  if (durationMinutes % 1440 === 0) {
    return `${durationMinutes / 1440}d`;
  }
  if (durationMinutes % 60 === 0) {
    return `${durationMinutes / 60}h`;
  }
  return `${durationMinutes * 60}s`;
}

function parseUptimeToSeconds(uptime?: string): number {
  if (!uptime || uptime === '0s') return 0;
  let totalSeconds = 0;
  const weeks = uptime.match(/(\d+)w/);
  const days = uptime.match(/(\d+)d/);
  const hours = uptime.match(/(\d+)h/);
  const minutes = uptime.match(/(\d+)m(?!s)/);
  const seconds = uptime.match(/(\d+)s/);
  if (weeks) totalSeconds += parseInt(weeks[1], 10) * 7 * 86400;
  if (days) totalSeconds += parseInt(days[1], 10) * 86400;
  if (hours) totalSeconds += parseInt(hours[1], 10) * 3600;
  if (minutes) totalSeconds += parseInt(minutes[1], 10) * 60;
  if (seconds) totalSeconds += parseInt(seconds[1], 10);
  return totalSeconds;
}

function findMatchingPackageForUser(comment?: string, profile?: string, limitUptime?: string) {
  const allPkgs = Array.from(dbStore.packages.values());
  if (comment) {
    for (const pkg of allPkgs) {
      if (comment.toLowerCase().includes(pkg.name.toLowerCase())) {
        return pkg;
      }
    }
  }
  if (profile) {
    const mbpsMatch = profile.match(/HS-(\d+)M/i);
    if (mbpsMatch) {
      const mbps = parseInt(mbpsMatch[1], 10);
      const pkg = allPkgs.find(p => p.downloadMbps === mbps);
      if (pkg) return pkg;
    }
  }
  if (limitUptime) {
    const norm = limitUptime.toLowerCase();
    if (norm === '1h' || norm === '60m') return allPkgs.find(p => p.id === 'pkg-1h');
    if (norm === '1d' || norm === '24h') return allPkgs.find(p => p.id === 'pkg-1d');
    if (norm === '1w' || norm === '7d') return allPkgs.find(p => p.id === 'pkg-7d');
    if (norm === '4w2d' || norm === '30d') return allPkgs.find(p => p.id === 'pkg-30d');
  }
  return allPkgs[0] || undefined;
}

export class UserService {
  private getAdapter() {
    return MikroTikAdapterFactory.getAdapter(() => Array.from(dbStore.connectors.values()).filter(c => c.status === 'ONLINE').length);
  }

  async getAllUsers(): Promise<HotspotUser[]> {
    await dbStore.initialize();

    try {
      const mikrotik = this.getAdapter();
      const [activeSessions, routerUsers] = await Promise.all([
        mikrotik.getActiveSessions().catch(() => []),
        mikrotik.getHotspotUsers().catch(() => [])
      ]);

      const activeUserMap = new Map(activeSessions.map(s => [s.username.toLowerCase(), s]));
      const existingUsersByUsername = new Map<string, HotspotUser>();
      for (const u of dbStore.users.values()) {
        existingUsersByUsername.set(u.username.toLowerCase(), u);
      }

      for (const ru of routerUsers) {
        if (!ru.name || ru.name.toLowerCase() === 'admin' || ru.name.toLowerCase() === 'default-trial') {
          continue;
        }

        const lowerName = ru.name.toLowerCase();
        const isVoucherLike = lowerName.startsWith('hs-') || (ru.comment && ru.comment.toLowerCase().includes('voucher'));

        // Import non-voucher hotspot users or existing tracked users
        if (!isVoucherLike || existingUsersByUsername.has(lowerName)) {
          const session = activeUserMap.get(lowerName);
          let existing = existingUsersByUsername.get(lowerName);

          const userStatus: 'ACTIVE' | 'DISABLED' | 'UNUSED' = ru.disabled
            ? 'DISABLED'
            : (session || (ru.uptime && ru.uptime !== '0s') || (ru.bytesIn || 0) > 0 ? 'ACTIVE' : 'UNUSED');

          if (!existing) {
            const matchedPkg = findMatchingPackageForUser(ru.comment, ru.profile, ru.limitUptime);
            const newUser: HotspotUser = {
              id: `usr-${ru.id ? ru.id.replace(/[^a-zA-Z0-9]/g, '') : ru.name}`,
              username: ru.name,
              fullName: ru.name,
              packageId: matchedPkg?.id || 'pkg-1h',
              packageName: matchedPkg?.name || 'Custom',
              profileName: ru.profile || 'default',
              status: userStatus,
              bytesIn: ru.bytesIn || 0,
              bytesOut: ru.bytesOut || 0,
              uptime: parseUptimeToSeconds(ru.uptime),
              notes: ru.comment,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            dbStore.users.set(newUser.id, newUser);
            existingUsersByUsername.set(lowerName, newUser);
          } else {
            existing.status = userStatus;
            existing.bytesIn = ru.bytesIn || existing.bytesIn;
            existing.bytesOut = ru.bytesOut || existing.bytesOut;
            if (ru.uptime) existing.uptime = parseUptimeToSeconds(ru.uptime);
            if (ru.comment) existing.notes = ru.comment;
            dbStore.users.set(existing.id, existing);
          }
        }
      }
    } catch (err) {
      console.warn('User router sync warning:', err);
    }

    return Array.from(dbStore.users.values());
  }

  async getUserById(id: string): Promise<HotspotUser> {
    await dbStore.initialize();
    const user = dbStore.users.get(id);
    if (!user) throw new NotFoundError('Hotspot user not found');
    return user;
  }

  async createUser(input: HotspotUserCreateInput, adminUsername = 'admin'): Promise<HotspotUser> {
    await dbStore.initialize();

    // Check duplicate
    for (const u of dbStore.users.values()) {
      if (u.username.toLowerCase() === input.username.toLowerCase()) {
        throw new ConflictError(`User ${input.username} already exists`);
      }
    }

    const pkg = dbStore.packages.get(input.packageId);
    const profileName = pkg ? `HS-${pkg.downloadMbps}M` : 'HS-5M';
    const limitUptime = pkg ? getRouterLimitUptime(pkg.durationMinutes) : '1d';

    // Synchronize to MikroTik Adapter (Mock or Live)
    const mikrotik = this.getAdapter();
    await mikrotik.createHotspotUser({
      name: input.username,
      password: input.password,
      profile: profileName,
      macAddress: input.macAddress || undefined,
      ipAddress: input.ipAddress || undefined,
      limitUptime,
      comment: `Created via HotSpot Manager. Pkg: ${pkg?.name || 'Custom'}`
    });

    const newUser: HotspotUser = {
      id: `usr-${Date.now()}`,
      username: input.username,
      fullName: input.fullName,
      phone: input.phone,
      packageId: input.packageId,
      packageName: pkg?.name,
      profileName,
      macAddress: input.macAddress,
      ipAddress: input.ipAddress,
      startAt: new Date().toISOString(),
      expiresAt: pkg ? new Date(Date.now() + pkg.durationMinutes * 60000).toISOString() : null,
      status: 'ACTIVE',
      bytesIn: 0,
      bytesOut: 0,
      uptime: 0,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.users.set(newUser.id, newUser);
    dbStore.logAudit({
      adminUsername,
      action: 'USER_CREATED',
      entity: 'HotspotUser',
      entityId: newUser.id,
      metadata: { username: newUser.username, package: pkg?.name }
    });

    return newUser;
  }

  async updateUser(id: string, input: HotspotUserUpdateInput, adminUsername = 'admin'): Promise<HotspotUser> {
    await dbStore.initialize();
    const existing = dbStore.users.get(id);
    if (!existing) throw new NotFoundError('Hotspot user not found');

    const mikrotik = this.getAdapter();
    const pkg = input.packageId ? dbStore.packages.get(input.packageId) : undefined;
    const profileName = pkg ? `HS-${pkg.downloadMbps}M` : (input.packageId ? undefined : existing.profileName);
    const limitUptime = pkg ? getRouterLimitUptime(pkg.durationMinutes) : undefined;

    // Sync all updates to router
    await mikrotik.updateHotspotUser(existing.username, {
      password: input.password || undefined,
      profile: profileName || existing.profileName,
      limitUptime,
      comment: input.notes !== undefined ? (input.notes || '') : existing.notes || undefined,
      macAddress: input.macAddress !== undefined ? (input.macAddress || '') : existing.macAddress || undefined
    });

    if (profileName) existing.profileName = profileName;
    if (pkg) {
      existing.packageName = pkg.name;
      existing.expiresAt = new Date(Date.now() + pkg.durationMinutes * 60000).toISOString();
    }

    if (input.status && input.status !== existing.status) {
      if (input.status === 'DISABLED' || input.status === 'BLOCKED' || input.status === 'EXPIRED') {
        await mikrotik.disableHotspotUser(existing.username);
      } else if (input.status === 'ACTIVE') {
        await mikrotik.enableHotspotUser(existing.username);
      }
      existing.status = input.status;
    }

    if (input.fullName !== undefined) existing.fullName = input.fullName;
    if (input.phone !== undefined) existing.phone = input.phone;
    if (input.macAddress !== undefined) existing.macAddress = input.macAddress;
    if (input.notes !== undefined) existing.notes = input.notes;
    existing.updatedAt = new Date().toISOString();

    dbStore.users.set(id, existing);
    dbStore.logAudit({
      adminUsername,
      action: 'USER_UPDATED',
      entity: 'HotspotUser',
      entityId: existing.id,
      metadata: { username: existing.username, status: existing.status }
    });

    return existing;
  }

  async resetPassword(id: string, newPass: string, adminUsername = 'admin'): Promise<boolean> {
    await dbStore.initialize();
    const user = dbStore.users.get(id);
    if (!user) throw new NotFoundError('User not found');

    const mikrotik = this.getAdapter();
    await mikrotik.updateHotspotUser(user.username, { password: newPass });

    dbStore.logAudit({
      adminUsername,
      action: 'USER_PASSWORD_RESET',
      entity: 'HotspotUser',
      entityId: user.id,
      metadata: { username: user.username }
    });

    return true;
  }

  async blockUser(id: string, reason?: string, adminUsername = 'admin'): Promise<HotspotUser> {
    await dbStore.initialize();
    const user = dbStore.users.get(id);
    if (!user) throw new NotFoundError('User not found');

    const mikrotik = this.getAdapter();
    await mikrotik.disableHotspotUser(user.username);
    await mikrotik.disconnectSession(user.username);

    user.status = 'BLOCKED';
    if (reason) user.notes = `${user.notes || ''} [Blocked: ${reason}]`;
    user.updatedAt = new Date().toISOString();

    dbStore.users.set(id, user);
    dbStore.logAudit({
      adminUsername,
      action: 'USER_BANNED',
      entity: 'HotspotUser',
      entityId: user.id,
      metadata: { username: user.username, reason }
    });

    return user;
  }

  async unblockUser(id: string, adminUsername = 'admin'): Promise<HotspotUser> {
    await dbStore.initialize();
    const user = dbStore.users.get(id);
    if (!user) throw new NotFoundError('User not found');

    const mikrotik = this.getAdapter();
    await mikrotik.enableHotspotUser(user.username);

    user.status = 'ACTIVE';
    user.updatedAt = new Date().toISOString();

    dbStore.users.set(id, user);
    dbStore.logAudit({
      adminUsername,
      action: 'USER_UNBANNED',
      entity: 'HotspotUser',
      entityId: user.id,
      metadata: { username: user.username }
    });

    return user;
  }

  async deleteUser(id: string, adminUsername = 'admin'): Promise<boolean> {
    await dbStore.initialize();
    const user = dbStore.users.get(id);
    if (!user) throw new NotFoundError('User not found');

    const mikrotik = this.getAdapter();
    await mikrotik.deleteHotspotUser(user.username);
    dbStore.users.delete(id);

    dbStore.logAudit({
      adminUsername,
      action: 'USER_DELETED',
      entity: 'HotspotUser',
      entityId: id,
      metadata: { username: user.username }
    });

    return true;
  }

  async disconnectUser(username: string, adminUsername = 'admin'): Promise<boolean> {
    const mikrotik = this.getAdapter();
    const res = await mikrotik.disconnectSession(username);

    dbStore.logAudit({
      adminUsername,
      action: 'SESSION_DISCONNECTED',
      entity: 'ActiveSession',
      metadata: { username }
    });

    return res;
  }
}

export const userService = new UserService();

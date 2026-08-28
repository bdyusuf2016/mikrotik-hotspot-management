import { dbStore } from '../repositories/index.js';
import { NotFoundError } from '../core/errors.js';
import type { HotspotPackageInput } from '@hotspot/shared';
import type { HotspotPackage } from '@hotspot/shared';

export class PackageService {
  async getAllPackages(): Promise<HotspotPackage[]> {
    await dbStore.initialize();
    return Array.from(dbStore.packages.values());
  }

  async getPackageById(id: string): Promise<HotspotPackage> {
    await dbStore.initialize();
    const pkg = dbStore.packages.get(id);
    if (!pkg) throw new NotFoundError('Package not found');
    return pkg;
  }

  async createPackage(input: HotspotPackageInput): Promise<HotspotPackage> {
    await dbStore.initialize();
    const rateLimitString = `${input.downloadMbps}M/${input.uploadMbps}M`;
    const newPackage: HotspotPackage = {
      id: `pkg-${Date.now()}`,
      name: input.name,
      price: input.price,
      durationMinutes: input.durationMinutes,
      downloadMbps: input.downloadMbps,
      uploadMbps: input.uploadMbps,
      dataLimitMB: input.dataLimitMB,
      sharedUsers: input.sharedUsers,
      sessionTimeout: input.sessionTimeout,
      idleTimeout: input.idleTimeout,
      validityMode: input.validityMode,
      rateLimitString,
      status: input.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    dbStore.packages.set(newPackage.id, newPackage);
    return newPackage;
  }

  async updatePackage(id: string, input: Partial<HotspotPackageInput>): Promise<HotspotPackage> {
    await dbStore.initialize();
    const existing = dbStore.packages.get(id);
    if (!existing) throw new NotFoundError('Package not found');

    const downloadMbps = input.downloadMbps ?? existing.downloadMbps;
    const uploadMbps = input.uploadMbps ?? existing.uploadMbps;
    const rateLimitString = `${downloadMbps}M/${uploadMbps}M`;

    const updated: HotspotPackage = {
      ...existing,
      ...input,
      downloadMbps,
      uploadMbps,
      rateLimitString,
      updatedAt: new Date().toISOString()
    };

    dbStore.packages.set(id, updated);
    return updated;
  }

  async deletePackage(id: string): Promise<boolean> {
    await dbStore.initialize();
    if (!dbStore.packages.has(id)) throw new NotFoundError('Package not found');
    return dbStore.packages.delete(id);
  }
}

export const packageService = new PackageService();

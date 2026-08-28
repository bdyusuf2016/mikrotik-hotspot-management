import { describe, it, expect } from 'vitest';
import { RouterSafetyGuard } from '../src/core/router-safety.guard.js';
import { ForbiddenError } from '../src/core/errors.js';

describe('Phase 6 & 7 RouterOS Safety Guards & Security Enforcement', () => {
  it('should allow write operations targeting /ip/hotspot/user', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/user/add', true);
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/user/set', true);
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/user/remove', true);
    }).not.toThrow();
  });

  it('should allow write operations targeting /ip/hotspot/user/profile', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/user/profile/add', true);
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/user/profile/set', true);
    }).not.toThrow();
  });

  it('should allow removing active hotspot sessions', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/ip/hotspot/active/remove', true);
    }).not.toThrow();
  });

  it('should STRICTLY FORBID modifying PPPoE Client interfaces', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/interface/pppoe-client/set', true);
    }).toThrow(ForbiddenError);
  });

  it('should STRICTLY FORBID modifying SSTP VPN Client interface (REEMOTE_ACCESS)', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/interface/sstp-client/disable', true);
    }).toThrow(ForbiddenError);
  });

  it('should STRICTLY FORBID altering IP Firewall or NAT rules', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/ip/firewall/nat/remove', true);
    }).toThrow(ForbiddenError);
  });

  it('should STRICTLY FORBID modifying bridge or ethernet physical settings', () => {
    expect(() => {
      RouterSafetyGuard.assertSafeCommand('/interface/bridge/remove', true);
    }).toThrow(ForbiddenError);
  });
});

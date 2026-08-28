import { create } from 'zustand';
import type { AdminUser } from '@hotspot/shared';

interface AuthState {
  user: AdminUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AdminUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('hotspot_user');
  const savedAccess = localStorage.getItem('hotspot_access_token');
  const savedRefresh = localStorage.getItem('hotspot_refresh_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    accessToken: savedAccess,
    refreshToken: savedRefresh,
    isAuthenticated: !!savedAccess,
    setAuth: (user, accessToken, refreshToken) => {
      localStorage.setItem('hotspot_user', JSON.stringify(user));
      localStorage.setItem('hotspot_access_token', accessToken);
      localStorage.setItem('hotspot_refresh_token', refreshToken);
      set({ user, accessToken, refreshToken, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('hotspot_user');
      localStorage.removeItem('hotspot_access_token');
      localStorage.removeItem('hotspot_refresh_token');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
    }
  };
});

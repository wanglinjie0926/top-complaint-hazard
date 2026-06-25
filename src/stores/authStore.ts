import { create } from 'zustand';
import { User, UserRole } from '@/types';

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (role: UserRole, city: string, county?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  login: (role, city, county) => {
    const user: User = {
      id: 'user-1',
      username: role === UserRole.CITY_ADMIN ? 'city_admin' : 'county_admin',
      name: role === UserRole.CITY_ADMIN ? '地市管理员' : '区县管理员',
      role,
      city,
      county
    };
    set({ currentUser: user, isLoggedIn: true });
  },
  logout: () => set({ currentUser: null, isLoggedIn: false })
}));

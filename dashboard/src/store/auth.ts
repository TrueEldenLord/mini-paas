import { create } from 'zustand';

interface AuthStore {
  username: string | null;
  email: string | null;
  setUser: (username: string | null, email: string | null) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  username: null,
  email: null,
  setUser: (username, email) => set({ username, email }),
  clearUser: () => set({ username: null, email: null }),
}));

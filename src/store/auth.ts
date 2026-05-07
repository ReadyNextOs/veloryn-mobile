// Auth store — sparowane urządzenie, aktualny user.
// Zustand + persist middleware zapisujący JSON do expo-secure-store.
// Przechowuje tylko lekkie metadane (nie Bearer token — ten jest w secureStorage.ts).

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { Tenant, User } from '@/types';

const AUTH_STORE_KEY = 'veloryn.auth_store';

const secureStoreStorage = {
  getItem: async (name: string): Promise<string | null> => SecureStore.getItemAsync(name),
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export interface AuthState {
  isPaired: boolean;
  user: User | null;
  tenant: Tenant | null;
  apiHost: string | null;
}

interface AuthStore extends AuthState {
  setAuthState: (patch: Partial<AuthState>) => void;
  resetAuth: () => void;
}

const INITIAL_STATE: AuthState = {
  isPaired: false,
  user: null,
  tenant: null,
  apiHost: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...INITIAL_STATE,
      setAuthState: (patch) => set((prev) => ({ ...prev, ...patch })),
      resetAuth: () => set(INITIAL_STATE),
    }),
    {
      name: AUTH_STORE_KEY,
      storage: createJSONStorage(() => secureStoreStorage),
      // Nie persystuj user/tenant — odświeżamy po starcie przez getMe()
      partialize: (state) => ({
        isPaired: state.isPaired,
        apiHost: state.apiHost,
      }),
    },
  ),
);

// Auth store — sparowane urzadzenie, aktualny user.
//
// TODO Sprint 1 (RN-006):
// - zainstalowac zustand: npx expo install zustand
// - przepisac na realny zustand create() + persistence przez secureStorage
//
// Tymczasowo prosty observable-state singleton.

import type { Tenant, User } from '@/types';

export interface AuthState {
  isPaired: boolean;
  user: User | null;
  tenant: Tenant | null;
  apiHost: string | null;
}

type Listener = (state: AuthState) => void;

let state: AuthState = {
  isPaired: false,
  user: null,
  tenant: null,
  apiHost: null,
};
const listeners = new Set<Listener>();

export function getAuthState(): AuthState {
  return state;
}

export function setAuthState(patch: Partial<AuthState>): void {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn(state));
}

export function subscribeAuth(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function resetAuth(): void {
  setAuthState({ isPaired: false, user: null, tenant: null, apiHost: null });
}

// Messenger Zustand store — typing indicators, socket connection state.

import { create } from 'zustand';
import type { Uuid } from '@/types/auth';

export interface TypingUser {
  userId: Uuid;
  displayName: string;
  expiresAt: number; // timestamp ms
}

interface MessengerStore {
  /** threadId → list of currently typing users */
  typingByThread: Map<string, TypingUser[]>;
  setTypingUsers: (threadId: string, users: TypingUser[]) => void;
  addTypingUser: (threadId: string, user: TypingUser) => void;
  removeExpiredTyping: (threadId: string) => void;
  clearTyping: (threadId: string) => void;
}

export const useMessengerStore = create<MessengerStore>((set, get) => ({
  typingByThread: new Map(),

  setTypingUsers: (threadId, users) =>
    set((state) => {
      const next = new Map(state.typingByThread);
      next.set(threadId, users);
      return { typingByThread: next };
    }),

  addTypingUser: (threadId, user) =>
    set((state) => {
      const next = new Map(state.typingByThread);
      const existing = next.get(threadId) ?? [];
      const filtered = existing.filter((u) => u.userId !== user.userId);
      next.set(threadId, [...filtered, user]);
      return { typingByThread: next };
    }),

  removeExpiredTyping: (threadId) => {
    const now = Date.now();
    set((state) => {
      const next = new Map(state.typingByThread);
      const existing = next.get(threadId) ?? [];
      const active = existing.filter((u) => u.expiresAt > now);
      if (active.length !== existing.length) {
        next.set(threadId, active);
        return { typingByThread: next };
      }
      return state;
    });
  },

  clearTyping: (threadId) =>
    set((state) => {
      const next = new Map(state.typingByThread);
      next.delete(threadId);
      return { typingByThread: next };
    }),
}));

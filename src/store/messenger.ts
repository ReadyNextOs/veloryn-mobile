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

  /**
   * Server message IDs sent by this client in the last ~10 s.
   * Used by useMessengerSocket to skip the Reverb echo of our own messages
   * and prevent duplicate entries in the cache.
   */
  recentlySentByMe: Set<string>;
  addRecentlySent: (messageId: string) => void;
}

export const useMessengerStore = create<MessengerStore>((set, get) => ({
  typingByThread: new Map(),

  recentlySentByMe: new Set(),

  addRecentlySent: (messageId: string) => {
    set((state) => {
      const next = new Set(state.recentlySentByMe);
      next.add(messageId);
      return { recentlySentByMe: next };
    });
    // Auto-cleanup after 10 s
    setTimeout(() => {
      set((state) => {
        if (!state.recentlySentByMe.has(messageId)) return state;
        const next = new Set(state.recentlySentByMe);
        next.delete(messageId);
        return { recentlySentByMe: next };
      });
    }, 10_000);
  },

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

// Messenger API — wszystkie endpointy modułu Messenger.
// Wymaga Bearer Sanctum + X-Tenant-Id (auto przez client.ts).

import { apiDelete, apiGet, apiPost, apiPut } from '@/api/client';
import type {
  Message,
  MessageListResponse,
  SendMessageRequest,
  SubscriptionLevel,
  Thread,
} from '@/types/messenger';

export interface ThreadsResponse {
  data: Thread[];
}

export interface ThreadResponse {
  data: Thread;
}

export interface MessageResponse {
  data: Message;
}

export interface MessengerListMessagesParams {
  cursor_before?: string;
  cursor_after?: string;
  limit?: number;
}

export const messengerApi = {
  listThreads: (): Promise<ThreadsResponse> =>
    apiGet<ThreadsResponse>('/api/messenger/threads'),

  getThread: (id: string): Promise<ThreadResponse> =>
    apiGet<ThreadResponse>(`/api/messenger/threads/${id}`),

  createThread: (body: {
    name?: string;
    type: 'direct' | 'group' | 'channel';
    participant_ids: string[];
    is_private?: boolean;
  }): Promise<ThreadResponse> =>
    apiPost<ThreadResponse>('/api/messenger/threads', body),

  updateThread: (id: string, body: Partial<{ name: string; description: string }>): Promise<ThreadResponse> =>
    apiPut<ThreadResponse>(`/api/messenger/threads/${id}`, body),

  deleteThread: (id: string): Promise<void> =>
    apiDelete<void>(`/api/messenger/threads/${id}`),

  leaveThread: (id: string): Promise<void> =>
    apiPost<void>(`/api/messenger/threads/${id}/leave`),

  markThreadRead: (threadId: string): Promise<void> =>
    apiPost<void>(`/api/messenger/threads/${threadId}/read`),

  listMessages: (
    threadId: string,
    params?: MessengerListMessagesParams,
  ): Promise<MessageListResponse> =>
    apiGet<MessageListResponse>(`/api/messenger/threads/${threadId}/messages`, {
      params: params ?? {},
    }),

  sendMessage: (threadId: string, body: SendMessageRequest): Promise<MessageResponse> =>
    apiPost<MessageResponse>(`/api/messenger/threads/${threadId}/messages`, body),

  updateMessage: (messageId: string, body: { body: string }): Promise<MessageResponse> =>
    apiPut<MessageResponse>(`/api/messenger/messages/${messageId}`, body),

  deleteMessage: (messageId: string): Promise<void> =>
    apiDelete<void>(`/api/messenger/messages/${messageId}`),

  toggleReaction: (messageId: string, emoji: string): Promise<void> =>
    apiPost<void>(`/api/messenger/messages/${messageId}/reaction`, { emoji }),

  openDM: (userId: string): Promise<ThreadResponse> =>
    apiPost<ThreadResponse>(`/api/messenger/dm/${userId}`),

  setTyping: (threadId: string): Promise<void> =>
    apiPost<void>(`/api/messenger/threads/${threadId}/typing`),

  setSubscription: (threadId: string, level: SubscriptionLevel): Promise<void> =>
    apiPut<void>(`/api/messenger/threads/${threadId}/subscription`, { level }),
};

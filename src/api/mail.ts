// Mail API — wszystkie endpointy skrzynki pocztowej.
// Wymaga Bearer Sanctum + X-Tenant-Id (auto przez client.ts).

import { apiGet, apiPost } from '@/api/client';
import type {
  EmailDetailRaw,
  MailAccount,
  MailAttachment,
  MailFolderRaw,
  MailListParams,
  MailListResponse,
  MailNotificationSummary,
} from '@/types/mail';

function buildListParams(params?: MailListParams): Record<string, string | number> {
  if (!params) return {};
  const out: Record<string, string | number> = {};
  if (params.page !== undefined) out['page'] = params.page;
  if (params.per_page !== undefined) out['per_page'] = params.per_page;
  if (params.search) out['search'] = params.search;
  if (params.unread === true) out['unread'] = 1;
  if (params.flagged === true) out['flagged'] = 1;
  if (params.has_attachments === true) out['has_attachments'] = 1;
  return out;
}

export const mailApi = {
  listAccounts: (): Promise<{ data: MailAccount[] }> =>
    apiGet<{ data: MailAccount[] }>('/api/mail/accounts'),

  listFolders: (accountId: string): Promise<{ data: MailFolderRaw[] }> =>
    apiGet<{ data: MailFolderRaw[] }>(`/api/mail/accounts/${accountId}/folders`),

  listMessages: (
    accountId: string,
    folderId: string,
    params?: MailListParams,
  ): Promise<MailListResponse> =>
    apiGet<MailListResponse>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages`,
      { params: buildListParams(params) },
    ),

  getMessage: (
    accountId: string,
    folderId: string,
    messageId: string,
  ): Promise<{ data: EmailDetailRaw }> =>
    apiGet<{ data: EmailDetailRaw }>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages/${messageId}`,
    ),

  markRead: (
    accountId: string,
    folderId: string,
    messageIds: string[],
  ): Promise<void> =>
    apiPost<void>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages/mark-read`,
      { message_ids: messageIds },
    ),

  markUnread: (
    accountId: string,
    folderId: string,
    messageIds: string[],
  ): Promise<void> =>
    apiPost<void>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages/mark-unread`,
      { message_ids: messageIds },
    ),

  toggleFlag: (
    accountId: string,
    folderId: string,
    messageIds: string[],
  ): Promise<void> =>
    apiPost<void>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages/flag`,
      { message_ids: messageIds },
    ),

  getAttachment: (
    accountId: string,
    folderId: string,
    messageId: string,
    attachmentId: string,
  ): Promise<MailAttachment> =>
    apiGet<MailAttachment>(
      `/api/mail/accounts/${accountId}/folders/${folderId}/messages/${messageId}/attachments/${attachmentId}`,
    ),

  getNotificationSummary: (): Promise<MailNotificationSummary> =>
    apiGet<MailNotificationSummary>('/api/mail/notifications/summary'),
};

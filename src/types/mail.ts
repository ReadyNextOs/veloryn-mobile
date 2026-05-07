import type { IsoTimestamp, Uuid } from './auth';

// MailAccount — reprezentuje skrzynkę pocztową użytkownika
export interface MailAccount {
  id: Uuid;
  email: string;
  display_name: string;
  provider: string | null;
}

export interface MailFolder {
  id: Uuid;
  account_id: Uuid;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  /** API zwraca unread_messages — mapujemy na unread_count w hooku */
  unread_count: number;
  total_count: number;
  parent_id: Uuid | null;
  icon: string | null;
  is_visible: boolean;
  is_excluded: boolean;
  priority: number;
}

// Kształt z API (przed mapowaniem)
export interface MailFolderRaw {
  id: Uuid;
  account_id: Uuid;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  unread_messages: number;
  total_messages: number;
  parent_id: Uuid | null;
  icon: string | null;
  is_visible: boolean;
  is_excluded: boolean;
  priority: number;
}

export interface EmailAddress {
  email: string;
  name: string | null;
  display?: string | null;
}

export interface MailAttachment {
  id: Uuid;
  filename: string;
  mime_type: string;
  size_bytes: number;
  is_inline: boolean;
  is_image: boolean;
  download_url: string | null;
  can_download: boolean;
  needs_lazy_load: boolean;
}

// List item — z API (is_flagged → mapujemy na is_starred)
export interface MailListItemRaw {
  id: Uuid;
  email_id: string;
  subject: string;
  from: EmailAddress;
  preview: string;
  received_at: IsoTimestamp;
  is_read: boolean;
  is_flagged: boolean;
  has_attachments: boolean;
  attachments_count: number;
  size_bytes: number;
}

// List item — po mapowaniu (is_starred w UI)
export interface MailListItem {
  id: Uuid;
  email_id: string;
  subject: string;
  from: EmailAddress;
  preview: string;
  received_at: IsoTimestamp;
  is_read: boolean;
  is_starred: boolean;
  has_attachments: boolean;
  attachments_count: number;
  size_bytes: number;
}

// Detail — z API
export interface EmailDetailRaw extends MailListItemRaw {
  body_html: string | null;
  body_text: string | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  attachments: MailAttachment[];
}

// Detail — po mapowaniu
export interface EmailDetail extends MailListItem {
  body_html: string | null;
  body_text: string | null;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  attachments: MailAttachment[];
}

export interface MailListResponse {
  data: MailListItemRaw[];
  current_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
}

export interface MailNotificationSummary {
  total_unread: number;
  unread_per_account: Record<Uuid, number>;
}

export interface MailListParams {
  page?: number;
  per_page?: number;
  search?: string;
  unread?: boolean;
  flagged?: boolean;
  has_attachments?: boolean;
}

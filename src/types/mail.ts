import type { IsoTimestamp, Uuid } from './auth';

export interface MailFolder {
  id: Uuid;
  account_id: Uuid;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'archive' | 'custom';
  unread_count: number;
  total_count: number;
  parent_id: Uuid | null;
}

export interface EmailAddress {
  email: string;
  name: string | null;
}

export interface Attachment {
  id: Uuid;
  filename: string;
  content_type: string;
  size_bytes: number;
  is_inline: boolean;
  download_url: string | null;
  presigned_url: string | null;
  presigned_url_expires_at: IsoTimestamp | null;
}

export interface Email {
  id: Uuid;
  rfc_message_id: string | null;
  thread_id: Uuid | null;
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  reply_to: EmailAddress | null;
  preview: string;
  body_html: string | null;
  body_text: string | null;
  has_attachments: boolean;
  attachments_count: number;
  attachments: Attachment[] | null;
  is_read: boolean;
  is_starred: boolean;
  is_anchored: boolean;
  folder_id: Uuid;
  account_id: Uuid;
  sent_at: IsoTimestamp | null;
  received_at: IsoTimestamp;
}

export interface MailListItem {
  id: Uuid;
  thread_id: Uuid | null;
  subject: string;
  from: EmailAddress;
  preview: string;
  has_attachments: boolean;
  is_read: boolean;
  is_starred: boolean;
  received_at: IsoTimestamp;
}

export interface MailListResponse {
  data: MailListItem[];
  current_page: number;
  per_page: number;
  total: number;
  next_page_url: string | null;
}

export interface MailNotificationSummary {
  unread_total: number;
  unread_per_folder: Record<Uuid, number>;
}

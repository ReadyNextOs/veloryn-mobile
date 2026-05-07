import type { IsoTimestamp, User, Uuid } from './auth';

export type ThreadType = 'direct' | 'group' | 'channel';

export interface Thread {
  id: Uuid;
  type: ThreadType;
  name: string | null;
  description: string | null;
  is_private: boolean;
  participants_count: number;
  unread_count: number;
  last_message: ThreadLastMessage | null;
  last_activity_at: IsoTimestamp;
  created_at: IsoTimestamp;
  participants?: ThreadParticipant[];
  subscription?: ThreadSubscription;
}

export interface ThreadLastMessage {
  id: Uuid;
  body_preview: string;
  author_id: Uuid;
  author_display_name: string;
  created_at: IsoTimestamp;
  has_attachments: boolean;
}

export interface ThreadParticipant {
  user_id: Uuid;
  user: Pick<User, 'id' | 'display_name' | 'avatar_url' | 'email'>;
  role: 'owner' | 'admin' | 'member';
  joined_at: IsoTimestamp;
  last_read_at: IsoTimestamp | null;
}

export type SubscriptionLevel = 'all' | 'mentions' | 'off';

export interface ThreadSubscription {
  thread_id: Uuid;
  level: SubscriptionLevel;
}

export type MessageType = 'text' | 'system' | 'call' | 'file';

export interface Message {
  id: Uuid;
  thread_id: Uuid;
  author_id: Uuid;
  author?: Pick<User, 'id' | 'display_name' | 'avatar_url'>;
  type: MessageType;
  body: string;
  body_html: string | null;
  is_question: boolean;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_id: Uuid | null;
  reactions: Reaction[];
  attachments: MessageAttachment[];
  mentions: Uuid[];
  created_at: IsoTimestamp;
  updated_at: IsoTimestamp;
}

export interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
  user_ids: Uuid[];
}

export interface MessageAttachment {
  id: Uuid;
  filename: string;
  content_type: string;
  size_bytes: number;
  download_url: string | null;
  presigned_url: string | null;
}

export interface MessageListResponse {
  data: Message[];
  has_more_before: boolean;
  has_more_after: boolean;
  cursor_before: string | null;
  cursor_after: string | null;
}

export interface SendMessageRequest {
  body: string;
  reply_to_id?: Uuid | null;
  mentions?: Uuid[];
  attachment_ids?: Uuid[];
}

export type MessengerBroadcastEvent =
  | {
      event: 'message.created';
      thread_id: Uuid;
      message: Message;
    }
  | {
      event: 'message.updated';
      thread_id: Uuid;
      message: Message;
    }
  | {
      event: 'message.deleted';
      thread_id: Uuid;
      message_id: Uuid;
    }
  | {
      event: 'thread.read';
      thread_id: Uuid;
      user_id: Uuid;
      last_read_at: IsoTimestamp;
    }
  | {
      event: 'reaction.added' | 'reaction.removed';
      thread_id: Uuid;
      message_id: Uuid;
      emoji: string;
      user_id: Uuid;
    }
  | {
      event: 'typing';
      thread_id: Uuid;
      user_id: Uuid;
      expires_at: IsoTimestamp;
    };

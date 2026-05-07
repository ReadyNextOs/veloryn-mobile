import { useQuery } from '@tanstack/react-query';
import { mailApi } from '@/api/mail';
import type { EmailDetail, EmailDetailRaw } from '@/types/mail';

function mapDetail(raw: EmailDetailRaw): EmailDetail {
  return {
    id: raw.id,
    email_id: raw.email_id,
    subject: raw.subject,
    from: raw.from,
    preview: raw.preview,
    received_at: raw.received_at,
    is_read: raw.is_read,
    is_starred: raw.is_flagged,
    has_attachments: raw.has_attachments,
    attachments_count: raw.attachments_count,
    size_bytes: raw.size_bytes,
    body_html: raw.body_html,
    body_text: raw.body_text,
    to: raw.to,
    cc: raw.cc,
    bcc: raw.bcc,
    attachments: raw.attachments,
  };
}

export function useMailMessage(
  accountId: string | null,
  folderId: string | null,
  messageId: string | null,
) {
  return useQuery<EmailDetail>({
    queryKey: ['mail', 'message', accountId, folderId, messageId],
    queryFn: async () => {
      if (!accountId || !folderId || !messageId) {
        throw new Error('Missing params');
      }
      const res = await mailApi.getMessage(accountId, folderId, messageId);
      return mapDetail(res.data);
    },
    enabled: !!accountId && !!folderId && !!messageId,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

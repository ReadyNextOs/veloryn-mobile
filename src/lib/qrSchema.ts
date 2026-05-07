// Zod schema walidacji QrPayloadV1.
// Używane w ekranie skanera QR przed wywołaniem pair API.

import { z } from 'zod';

export const qrPayloadV1Schema = z.object({
  v: z.literal(1),
  token: z.string().min(1),
  host: z.string().url(),
  tenant_id: z.string().uuid(),
  tenant_code: z.string().min(1),
  user_email: z.string().email(),
  issued_at: z.string().datetime({ offset: true }),
  expires_at: z.string().datetime({ offset: true }),
});

export type QrPayloadV1Parsed = z.infer<typeof qrPayloadV1Schema>;

/** Parse + walidacja JSON z QR. Rzuca ZodError przy błędzie. */
export function parseQrPayload(raw: string): QrPayloadV1Parsed {
  const parsed: unknown = JSON.parse(raw);
  return qrPayloadV1Schema.parse(parsed);
}

/** Sprawdź czy QR nie jest przeterminowany (TTL check po stronie mobile). */
export function isQrExpired(payload: QrPayloadV1Parsed): boolean {
  return new Date(payload.expires_at) <= new Date();
}

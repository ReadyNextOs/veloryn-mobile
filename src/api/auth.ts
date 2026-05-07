// Auth API helpers — pair device + me endpoint.

import axios from 'axios';
import { ApiError } from '@/api/client';
import type { QrPayloadV1, Tenant, User } from '@/types';

interface DeviceInfo {
  platform: string;
  app_version: string | null;
}

interface PairResponse {
  user: User;
  tenant: Tenant;
  abilities: string[];
}

/** Wywołaj pair endpoint z tokenem QR i info o urządzeniu. */
export async function pairDevice(
  payload: QrPayloadV1,
  deviceInfo: DeviceInfo,
): Promise<PairResponse> {
  // Pair używa osobnego klienta bez Bearer — token jest w body, jak PIN
  const client = axios.create({
    baseURL: payload.host,
    timeout: 15_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Tenant-Id': payload.tenant_id,
    },
  });

  try {
    const response = await client.post<PairResponse>('/api/auth/mobile-tokens/pair', {
      token: payload.token,
      device_info: deviceInfo,
    });
    return response.data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response) {
      const data = err.response.data as Record<string, unknown> | undefined;
      const message =
        typeof data?.['message'] === 'string' ? data['message'] : `HTTP ${err.response.status}`;
      const code = typeof data?.['code'] === 'string' ? data['code'] : undefined;
      throw new ApiError(err.response.status, message, code);
    }
    throw err;
  }
}

/** Pobierz zalogowanego usera (wymaga sparowanego klienta axios z Bearer). */
export async function getMe(): Promise<User> {
  // Importujemy dynamicznie żeby uniknąć circular dep przy pierwszym para
  const { apiGet } = await import('@/api/client');
  return apiGet<User>('/api/me');
}

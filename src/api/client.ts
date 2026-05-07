// HTTP client dla mobile API.
//
// TODO Sprint 1 (RN-003): zainstalowac axios i zastapic fetch.
//   npx expo install axios
//
// Tymczasowo prosty fetch-wrapper: trzyma host + Bearer + X-Tenant-Id w module
// state, eksportuje get/post/del/put.

import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';

let cachedHost: string | null = null;
let cachedToken: string | null = null;
let cachedTenantId: string | null = null;

async function loadCreds(): Promise<void> {
  if (cachedToken !== null) return;
  cachedHost = await getSecure(SECURE_KEYS.apiHost);
  cachedToken = await getSecure(SECURE_KEYS.apiToken);
  cachedTenantId = await getSecure(SECURE_KEYS.tenantId);
}

export function clearApiCreds(): void {
  cachedHost = null;
  cachedToken = null;
  cachedTenantId = null;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly payload: unknown,
    message?: string,
  ) {
    super(message ?? `API ${status}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  await loadCreds();

  if (!cachedHost) {
    throw new ApiError(0, null, 'Host API nie jest ustawiony — wymagane sparowanie QR.');
  }

  const url = new URL(path.startsWith('http') ? path : `${cachedHost}${path}`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (cachedToken) headers.Authorization = `Bearer ${cachedToken}`;
  if (cachedTenantId) headers['X-Tenant-Id'] = cachedTenantId;

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(response.status, payload);
  }

  return payload as T;
}

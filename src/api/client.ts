// HTTP client — axios z Sanctum Bearer + X-Tenant-Id.
// Credentials czytane z expo-secure-store (via secureStorage module).
// 401 interceptor: czyści storage i emituje 'auth:logout' przez AuthEventEmitter.

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { clearAllSecure, getSecure, SECURE_KEYS } from '@/lib/secureStorage';
import { authLogoutEmitter } from '@/lib/authEvents';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code ?? null;
  }
}

let _client: AxiosInstance | null = null;

async function buildClient(): Promise<AxiosInstance> {
  const apiHost = await getSecure(SECURE_KEYS.apiHost);
  const apiToken = await getSecure(SECURE_KEYS.apiToken);
  const tenantId = await getSecure(SECURE_KEYS.tenantId);

  const baseURL = apiHost ?? (process.env['EXPO_PUBLIC_API_URL'] ?? 'https://dev.veloryn.pl');

  const instance = axios.create({
    baseURL,
    timeout: 15_000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      ...(tenantId ? { 'X-Tenant-Id': tenantId } : {}),
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        resetClient(); // zeruj singleton PRZED clearAllSecure — brak stale tokenu
        await clearAllSecure();
        authLogoutEmitter.emit('auth:logout');
      }
      if (error instanceof AxiosError && error.response) {
        const data = error.response.data as Record<string, unknown> | undefined;
        const message =
          typeof data?.['message'] === 'string'
            ? data['message']
            : `HTTP ${error.response.status}`;
        const code =
          typeof data?.['code'] === 'string' ? data['code'] : undefined;
        throw new ApiError(error.response.status, message, code);
      }
      throw error;
    },
  );

  return instance;
}

/** Pobiera (lub tworzy) klienta axios. Odtwarza przy każdym wywołaniu jeśli _client===null. */
export async function getClient(): Promise<AxiosInstance> {
  if (_client === null) {
    _client = await buildClient();
  }
  return _client;
}

/** Wyczyść klienta (po logout / re-pair). */
export function resetClient(): void {
  _client = null;
}

export async function apiGet<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
  const client = await getClient();
  const response = await client.get<T>(path, config);
  return response.data;
}

export async function apiPost<T>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const client = await getClient();
  const response = await client.post<T>(path, data, config);
  return response.data;
}

export async function apiPut<T>(
  path: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const client = await getClient();
  const response = await client.put<T>(path, data, config);
  return response.data;
}

export async function apiDelete<T = void>(
  path: string,
  config?: AxiosRequestConfig,
): Promise<T> {
  const client = await getClient();
  const response = await client.delete<T>(path, config);
  return response.data;
}

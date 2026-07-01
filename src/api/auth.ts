// Auth API helpers — pair device + login + me endpoint.

import { create, isAxiosError } from 'axios';
import { apiGet, ApiError } from '@/api/client';
import type {
  MobileLoginRequest,
  MobileLoginResponse,
  QrPayloadV1,
  Tenant,
  User,
} from '@/types';

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
  const client = create({
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
    if (isAxiosError(err) && err.response) {
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
  return apiGet<User>('/api/me');
}

/** Zbuduj ApiError z odpowiedzi błędu backendu (envelope `{ error: { code, message } }`). */
function toLoginApiError(status: number, body: unknown): ApiError {
  const data = body as Record<string, unknown> | undefined;
  const errorObj = (data?.['error'] ?? null) as Record<string, unknown> | null;
  const message =
    (typeof errorObj?.['message'] === 'string' ? errorObj['message'] : undefined) ??
    (typeof data?.['message'] === 'string' ? data['message'] : undefined) ??
    `HTTP ${status}`;
  const code = typeof errorObj?.['code'] === 'string' ? errorObj['code'] : undefined;
  return new ApiError(status, message, code);
}

/** Czy URL zawiera już konkretną ścieżkę (inną niż root "/")? */
function urlHasPath(rawUrl: string): boolean {
  try {
    const { pathname } = new URL(rawUrl);
    return Boolean(pathname && pathname !== '/');
  } catch {
    return false;
  }
}

/** Wynik logowania + baza URL, pod którą endpoint faktycznie odpowiedział. */
export interface LoginResult {
  data: MobileLoginResponse;
  effectiveHost: string;
}

/**
 * Zaloguj urządzenie mobilne za pomocą e-mail + hasło.
 *
 * Backend (POST /api/auth/mobile-tokens/login) wymienia credentiale na Sanctum
 * Bearer token z ability=mobile (od razu sparowany). Tenant rozpoznawany jest
 * z subdomeny hosta po stronie backendu.
 *
 * Ścieżka API różni się per-deployment: część serwerów wystawia API z roota
 * (`/api/...`), część spod aliasu nginx (`/backend/api/...`). Przy logowaniu QR
 * host jest w payloadzie (jednoznaczny), ale tu user wpisuje samą domenę — więc
 * próbujemy najpierw host tak jak podany, a przy 404/405 fallback z `/backend`.
 * Zwracamy `effectiveHost` (bazę, która zadziałała), żeby zapisać ją do kolejnych
 * requestów. Błędy inne niż 404/405 (401/403/422/429/5xx) oznaczają, że endpoint
 * istnieje — przerywamy próby i propagujemy błąd usera.
 *
 * @param host  URL serwera klienta (np. "https://firma.veloryn.pl"). Bez końcowego "/".
 * @throws ApiError przy 401/403/422/429.
 */
export async function loginWithCredentials(
  host: string,
  payload: MobileLoginRequest,
): Promise<LoginResult> {
  const base = host.replace(/\/+$/, '');
  // Jeśli user podał już konkretną ścieżkę — szanujemy ją, bez fallbacku.
  const candidates = urlHasPath(base) ? [base] : [base, `${base}/backend`];

  let attempt = 0;
  for (const candidate of candidates) {
    attempt += 1;
    const isLast = attempt === candidates.length;

    const client = create({
      baseURL: candidate,
      timeout: 15_000,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    try {
      const response = await client.post<{ success: boolean; data: MobileLoginResponse }>(
        '/api/auth/mobile-tokens/login',
        payload,
      );
      return { data: response.data.data, effectiveHost: candidate };
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        const status = err.response.status;
        // 404/405 = endpoint nie istnieje pod tą ścieżką → spróbuj kolejnego kandydata.
        if ((status === 404 || status === 405) && !isLast) {
          continue;
        }
        // Endpoint znaleziony (lub wyczerpaliśmy kandydatów) — to błąd usera/serwera.
        throw toLoginApiError(status, err.response.data);
      }
      // Network/timeout — ta sama domena, druga ścieżka też nie odpowie. Przerywamy.
      throw err;
    }
  }

  // Nieosiągalne (pętla zawsze zwraca lub rzuca), ale TS wymaga jawnego wyjścia.
  throw new ApiError(0, 'login: no candidates');
}

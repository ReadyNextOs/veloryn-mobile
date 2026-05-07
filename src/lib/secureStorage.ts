// Wrapper na expo-secure-store dla tokena Sanctum + payload sparowanego urzadzenia.
// Klucze przechowywane w Keychain (iOS) / Keystore (Android), zaszyfrowane przez OS.
//
// TODO Sprint 1 (RN-006): zainstalowac expo-secure-store i podlaczyc realne wywolania.
//   npx expo install expo-secure-store
//
// Tymczasowo eksport stub'ow zeby app.tsx skompilowal sie bez instalacji deps.

const STUB_WARN = '[secureStorage] expo-secure-store nie jest jeszcze zainstalowany — skutek: in-memory store, dane gina przy restarcie.';

const memory = new Map<string, string>();

export const SECURE_KEYS = {
  apiToken: 'veloryn.api_token',
  apiHost: 'veloryn.api_host',
  tenantId: 'veloryn.tenant_id',
  userEmail: 'veloryn.user_email',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];

export async function setSecure(key: SecureKey, value: string): Promise<void> {
  if (__DEV__) console.warn(STUB_WARN);
  memory.set(key, value);
}

export async function getSecure(key: SecureKey): Promise<string | null> {
  return memory.get(key) ?? null;
}

export async function deleteSecure(key: SecureKey): Promise<void> {
  memory.delete(key);
}

export async function clearAllSecure(): Promise<void> {
  for (const key of Object.values(SECURE_KEYS)) {
    memory.delete(key);
  }
}

// Wrapper na expo-secure-store dla tokena Sanctum + payload sparowanego urządzenia.
// Klucze przechowywane w Keychain (iOS) / Keystore (Android), zaszyfrowane przez OS.

import * as SecureStore from 'expo-secure-store';

export const SECURE_KEYS = {
  apiToken: 'veloryn.api_token',
  apiHost: 'veloryn.api_host',
  tenantId: 'veloryn.tenant_id',
  userEmail: 'veloryn.user_email',
} as const;

export type SecureKey = (typeof SECURE_KEYS)[keyof typeof SECURE_KEYS];

export async function setSecure(key: SecureKey, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getSecure(key: SecureKey): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function deleteSecure(key: SecureKey): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearAllSecure(): Promise<void> {
  await Promise.all(Object.values(SECURE_KEYS).map((key) => SecureStore.deleteItemAsync(key)));
}

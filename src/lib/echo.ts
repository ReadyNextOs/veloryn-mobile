// Laravel Echo — lazy singleton z Reverb (Pusher-compatible WebSocket).
// Init po pierwszym sparowaniu. Reset na auth:logout.

import { authLogoutEmitter } from '@/lib/authEvents';
import { getSecure, SECURE_KEYS } from '@/lib/secureStorage';

// Dynamic imports to avoid breaking in environments where these are not available
let _echo: unknown = null;
let _cleanupLogout: (() => void) | null = null;

export async function getEcho(): Promise<unknown> {
  if (_echo !== null) return _echo;

  const apiToken = await getSecure(SECURE_KEYS.apiToken);
  const apiHost = await getSecure(SECURE_KEYS.apiHost);

  if (!apiToken || !apiHost) return null;

  const reverbKey = process.env['EXPO_PUBLIC_REVERB_KEY'];
  const reverbHost = process.env['EXPO_PUBLIC_REVERB_HOST'];

  if (!reverbKey || !reverbHost) return null;

  try {
    // Dynamic imports to avoid bundler issues when deps not installed
    const [{ default: Echo }, { default: Pusher }] = await Promise.all([
      import('laravel-echo'),
      import('pusher-js/react-native'),
    ]);

    // pusher-js/react-native needs global Pusher
    (globalThis as Record<string, unknown>)['Pusher'] = Pusher;

    const echo = new Echo({
      broadcaster: 'reverb',
      key: reverbKey,
      wsHost: reverbHost,
      wsPort: 443,
      wssPort: 443,
      forceTLS: true,
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel: { name: string }) => ({
        authorize: (socketId: string, callback: (error: Error | null, authData: { auth: string; channel_data?: string; shared_secret?: string } | null) => void): void => {
          void (async () => {
            try {
              const { getClient } = await import('@/api/client');
              const client = await getClient();
              const res = await client.post<{ auth: string; channel_data?: string; shared_secret?: string }>(
                '/api/broadcasting/auth',
                { socket_id: socketId, channel_name: channel.name },
              );
              callback(null, res.data);
            } catch (err) {
              callback(err instanceof Error ? err : new Error(String(err)), null);
            }
          })();
        },
      }),
    });

    _echo = echo;

    // Auto-reset on logout
    if (_cleanupLogout) _cleanupLogout();
    _cleanupLogout = authLogoutEmitter.on(() => {
      resetEcho();
    });

    return _echo;
  } catch (err) {
    console.warn('[Echo] Failed to initialize:', err);
    return null;
  }
}

export function resetEcho(): void {
  if (_echo !== null) {
    try {
      (_echo as { disconnect?: () => void }).disconnect?.();
    } catch {
      // ignore disconnect errors
    }
    _echo = null;
  }
  if (_cleanupLogout) {
    _cleanupLogout();
    _cleanupLogout = null;
  }
}

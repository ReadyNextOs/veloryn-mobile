// Hook do rejestracji Expo Push Token i obsługi głębokiego linkowania z powiadomień.
// Wywołuj po każdym sparowaniu (success w usePairing).

import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { type EventSubscription } from 'expo-modules-core';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { z } from 'zod';
import { apiPost } from '@/api/client';
import { Sentry } from '@/lib/sentry';
import { useAuthStore } from '@/store/auth';

/**
 * Push notifications wymagaja na Androidzie poprawnego google-services.json
 * w kompilacji EAS. Bez tego getExpoPushTokenAsync() potrafi natywnie crashowac
 * apke. Aktualnie projekt NIE ma jeszcze Firebase setupu — wlaczamy push tylko
 * gdy explicite ustawiono `EXPO_PUBLIC_PUSH_ENABLED=1` w eas.json profilu.
 */
const PUSH_ENABLED = process.env.EXPO_PUBLIC_PUSH_ENABLED === '1';

interface DeviceRegistrationPayload {
  token: string;
  platform: 'expo';
  device_name?: string;
}

// ---------------------------------------------------------------------------
// Zod schema for push notification data — prevents path injection via
// malformed deep-link payloads (e.g. crafted thread_id with path separators).
// ---------------------------------------------------------------------------

const NotificationDataSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('mail'),
    message_id: z.string().uuid(),
    account_id: z.string().uuid(),
    folder_id: z.string().uuid(),
  }),
  z.object({
    type: z.literal('messenger.dm'),
    thread_id: z.string().uuid(),
  }),
  z.object({
    type: z.literal('messenger.mention'),
    thread_id: z.string().uuid(),
    message_id: z.string().uuid(),
  }),
]);

type ValidatedNotificationData = z.infer<typeof NotificationDataSchema>;

async function registerPushToken(): Promise<void> {
  Sentry.addBreadcrumb({ category: 'push', message: 'register:start', level: 'info' });

  if (!PUSH_ENABLED) {
    Sentry.addBreadcrumb({ category: 'push', message: 'register:skipped (PUSH_ENABLED=0)', level: 'info' });
    return;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Sentry.addBreadcrumb({ category: 'push', message: `register:permission_denied (${finalStatus})`, level: 'info' });
      return;
    }

    const projectId = Constants.expoConfig?.extra?.['eas']?.projectId
      ?? Constants.easConfig?.projectId;

    if (!projectId) {
      Sentry.captureMessage('push:no_project_id', { level: 'warning' });
      return;
    }

    Sentry.addBreadcrumb({ category: 'push', message: 'register:fetching_token', level: 'info' });
    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    Sentry.addBreadcrumb({ category: 'push', message: 'register:token_received', level: 'info' });

    const payload: DeviceRegistrationPayload = {
      token: tokenResult.data,
      platform: 'expo',
    };
    await apiPost<void>('/api/mobile/devices', payload);
    Sentry.addBreadcrumb({ category: 'push', message: 'register:done', level: 'info' });
  } catch (err) {
    // Non-critical: caught here so apka sie nie wywala. Sentry zlapie kontekst
    // do diagnozy (najczesciej brak google-services.json => natywny error z FCM).
    Sentry.captureException(err, { tags: { source: 'push_registration' } });
  }
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const raw = response.notification.request.content.data;
  const result = NotificationDataSchema.safeParse(raw);
  if (!result.success) {
    console.warn('[PushRegistration] Invalid notification data:', result.error.issues);
    return;
  }

  const data: ValidatedNotificationData = result.data;

  try {
    if (data.type === 'mail') {
      router.push({
        pathname: '/(app)/(tabs)/mail/[folderId]/[messageId]',
        params: {
          folderId: data.folder_id,
          messageId: data.message_id,
        },
      });
    } else if (data.type === 'messenger.dm' || data.type === 'messenger.mention') {
      router.push({
        pathname: '/(app)/(tabs)/messenger/[threadId]',
        params: { threadId: data.thread_id },
      });
    }
  } catch (err) {
    console.warn('[PushRegistration] Deep link navigation failed:', err);
  }
}

export function usePushRegistration(): void {
  const isPaired = useAuthStore((s) => s.isPaired);
  const hasRegisteredRef = useRef(false);
  const responseSubRef = useRef<EventSubscription | null>(null);
  const receivedSubRef = useRef<EventSubscription | null>(null);

  const register = useCallback(async () => {
    if (!isPaired || hasRegisteredRef.current) return;
    hasRegisteredRef.current = true;
    await registerPushToken();
  }, [isPaired]);

  useEffect(() => {
    void register();
  }, [register]);

  // Notification tap handler — deep link on app open
  useEffect(() => {
    responseSubRef.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse,
    );

    // Foreground handler — show in-app or silently update data
    receivedSubRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        // When app is in foreground, backend already distributed via Echo.
        // We could show an in-app toast here in Sprint 4.
        // Silently received — Echo handles real-time UI updates
        // (NotificationDataSchema.safeParse available if Sprint 4 needs in-app toast)
        void notification;
      },
    );

    return () => {
      responseSubRef.current?.remove();
      receivedSubRef.current?.remove();
    };
  }, []);
}

// Called after successful pairing to trigger push registration
export async function triggerPushRegistration(): Promise<void> {
  await registerPushToken();
}

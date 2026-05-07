// Hook do rejestracji Expo Push Token i obsługi głębokiego linkowania z powiadomień.
// Wywołuj po każdym sparowaniu (success w usePairing).

import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { type EventSubscription } from 'expo-modules-core';
import { router } from 'expo-router';
import { apiPost } from '@/api/client';
import { useAuthStore } from '@/store/auth';

interface DeviceRegistrationPayload {
  token: string;
  platform: 'expo';
  device_name?: string;
}

interface NotificationData {
  type?: string;
  message_id?: string;
  account_id?: string;
  folder_id?: string;
  thread_id?: string;
}

async function registerPushToken(): Promise<void> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return;
  }

  try {
    const tokenResult = await Notifications.getExpoPushTokenAsync();
    const payload: DeviceRegistrationPayload = {
      token: tokenResult.data,
      platform: 'expo',
    };
    await apiPost<void>('/api/mobile/devices', payload);
  } catch (err) {
    // Registration failure is non-critical — log and continue
    console.warn('[PushRegistration] Failed to register push token:', err);
  }
}

function handleNotificationResponse(response: Notifications.NotificationResponse): void {
  const data = response.notification.request.content.data as NotificationData | undefined;
  if (!data?.type) return;

  try {
    if (data.type === 'mail' && data.account_id && data.folder_id && data.message_id) {
      router.push({
        pathname: '/(tabs)/mail/[folderId]/[messageId]',
        params: {
          folderId: data.folder_id,
          messageId: data.message_id,
        },
      });
    } else if (data.type === 'messenger.dm' && data.thread_id) {
      router.push({
        pathname: '/(tabs)/messenger/[threadId]',
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
        const data = notification.request.content.data as NotificationData | undefined;
        if (data?.type) {
          // Silently received — Echo handles real-time UI updates
        }
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

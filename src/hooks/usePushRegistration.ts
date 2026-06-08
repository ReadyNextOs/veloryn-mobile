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
//
// Backend (kontrakt fcm-data-payload-contract-2026-06-05 §10) wysyla w `data`:
//   type       — kanoniczny typ (mail, messenger.dm, ...)
//   route      — glowny dyskryminator nawigacji (emailDetail, documentDetail, ...)
//   entity_id  — UUID encji docelowej
//   thread_id  — UUID watku (DM / wzmianka)
// Pola trafiajace do sciezki nawigacji (thread_id/folder_id/message_id) walidujemy
// jako UUID. entity_id nie jest dzis uzywany w sciezce (brak ekranow detalu na
// mobile poza mail/messenger) — modul otwieramy po slugu, nie po entity_id.
// ---------------------------------------------------------------------------

const uuid = z.string().uuid();

const NotificationDataSchema = z.object({
  type: z.string().optional(),
  route: z.string().optional(),
  entity_id: z.string().optional(),
  thread_id: uuid.optional(),
  message_id: uuid.optional(),
  account_id: uuid.optional(),
  folder_id: uuid.optional(),
});

type ValidatedNotificationData = z.infer<typeof NotificationDataSchema>;

// Mapa `route` -> slug modulu (src/config/modules.ts) dla encji bez natywnego
// ekranu detalu. Tap otwiera liste/placeholder modulu — najblizszy realny ekran,
// zgodnie z fallbackiem ze spec (fcm-mobile-navigation-spec-2026-06-08 §3).
// route'y bez slugu (briefingDetail, salesPlanDetail) -> fallback do dashboardu.
const ROUTE_TO_MODULE_SLUG: Record<string, string> = {
  documentDetail: 'documents',
  caseDetail: 'cases',
  taskDetail: 'tasks',
  calendarEvent: 'calendar',
  resourceBookingDetail: 'calendar',
  dealDetail: 'crm',
  leadDetail: 'crm',
  contractDetail: 'contracts',
  purchaseInvoiceDetail: 'purchase-invoices',
  salesInvoiceDetail: 'sales-invoices',
  delegationDetail: 'delegations',
  ticketDetail: 'tickets',
  purchaseRequestDetail: 'purchase-requests',
};

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

// Natywne ekrany detalu (mail/messenger). Zwraca true jesli obsluzono.
function navigateToNativeScreen(data: ValidatedNotificationData): boolean {
  // Mail — wymaga folder_id + message_id (UUID) do deep-linku w natywnym ekranie.
  if ((data.route === 'emailDetail' || data.type === 'mail') && data.folder_id && data.message_id) {
    router.push({
      pathname: '/(app)/(tabs)/mail/[folderId]/[messageId]',
      params: { folderId: data.folder_id, messageId: data.message_id },
    });
    return true;
  }

  // Messenger (DM / wzmianka) — wymaga thread_id (UUID).
  const isMessenger =
    data.route === 'messengerConversation' ||
    data.type === 'messenger.dm' ||
    data.type === 'messenger.mention';
  if (isMessenger && data.thread_id) {
    router.push({
      pathname: '/(app)/(tabs)/messenger/[threadId]',
      params: { threadId: data.thread_id },
    });
    return true;
  }

  return false;
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
    // 1) Natywne ekrany (mail/messenger) — deep-link z pelnym kompletem parametrow.
    if (navigateToNativeScreen(data)) return;

    // 2) Pozostale encje — nawigacja po `route` do listy/placeholdera modulu.
    const slug = data.route ? ROUTE_TO_MODULE_SLUG[data.route] : undefined;
    if (slug) {
      router.push({ pathname: '/(app)/modules/[slug]', params: { slug } });
      return;
    }

    // 3) Fallback — nieznany route / brak danych: otworz dashboard (nie crashuj).
    console.warn('[PushRegistration] Unhandled notification, route=', data.route, 'type=', data.type);
    router.push('/(app)/dashboard');
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

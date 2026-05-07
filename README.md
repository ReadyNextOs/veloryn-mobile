# Veloryn Mobile

Aplikacja mobilna iOS + Android dla Veloryn. React Native 0.76 + Expo SDK 53 + Expo Router.

**Bundle ID:** `pl.veloryn.app` (iOS i Android)
**Display name:** Veloryn
**Backend:** [ReadyNextOs/ready4docs](https://github.com/ReadyNextOs/ready4docs) (osobne repo)

## Status

Skeleton. Ekrany to placeholdery — implementacja faz wg planu w backendzie:
`docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md`.

## Pierwsze uruchomienie

```bash
git clone https://github.com/ReadyNextOs/veloryn-mobile.git
cd veloryn-mobile
npm install

# Konfiguracja env:
cp .env.example .env

# Start Expo Dev Server:
npx expo start                # QR do Expo Go lub dev build

# iOS Simulator:
npx expo start --ios

# Android Emulator:
npx expo start --android
```

## Struktura

```
veloryn-mobile/
├── app/                       # Expo Router (file-based routing)
│   ├── _layout.tsx            # Root Stack
│   ├── index.tsx              # Splash / redirect
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── pair.tsx           # QR scanner
│   └── (tabs)/
│       ├── _layout.tsx
│       ├── mail/
│       ├── messenger/
│       └── settings.tsx
├── src/
│   ├── api/                   # HTTP client (Sanctum Bearer)
│   ├── lib/                   # secureStorage, i18n
│   ├── store/                 # Zustand stores
│   ├── types/                 # typy API (synchroniczne z backendem)
│   └── components/            # komponenty UI
├── assets/                    # ikony, splash, fonty (TODO: dodac)
├── app.json                   # Expo config
├── eas.json                   # EAS Build profiles
├── babel.config.js
├── metro.config.js
├── tsconfig.json
├── .env.example
└── package.json
```

## Sprint 1 — pierwsze deps do zainstalowania

Skeleton uzywa minimalnego zestawu. Przed startem Sprintu 1 zainstaluj realne biblioteki:

```bash
# QR scanning + biometric
npx expo install expo-camera expo-local-authentication

# Secure storage + SQLite cache
npx expo install expo-secure-store expo-sqlite

# Push notifications
npx expo install expo-notifications expo-device

# State + data
npx expo install axios @tanstack/react-query zustand

# Real-time (Reverb)
npm install laravel-echo pusher-js

# Forms + walidacja
npm install react-hook-form zod @hookform/resolvers

# i18n (5 jezykow zgodnie z konwencjami Veloryn)
npm install i18next react-i18next
```

Po instalacji popraw stuby w `src/lib/secureStorage.ts`, `src/api/client.ts`, `src/store/auth.ts` (oznaczone `TODO Sprint 1`).

## Typy API (`src/types/`)

Typy odpowiadajace JSON payloadom z backendu Veloryn. **Utrzymywane recznie** —
gdy backend zmienia `JsonResource`, aktualizuj tutaj.

```ts
import type { Email, Thread, MobileToken, QrPayloadV1 } from '@/types';
```

W przyszlosci rozwazymy generacje z OpenAPI spec backendu.

## Komunikacja z backendem

```
Mobile App
   |
   |  HTTPS  Authorization: Bearer <sanctum_token>
   |         X-Tenant-Id: <tenant_uuid>
   |         Accept: application/json
   v
Veloryn API (Laravel)
```

Realtime przez **Reverb WebSocket** (laravel-echo + pusher-js). Konfiguracja
w `.env.example` (`EXPO_PUBLIC_REVERB_*`).

## EAS Build

```bash
# Pierwsza inicjalizacja (jednorazowo):
npx eas init                  # konfiguruje projectId w app.json
npx eas build:configure       # weryfikuje eas.json

# Build internal (TestFlight + Play Internal Testing):
npx eas build --profile preview --platform all

# Production:
npx eas build --profile production --platform all
```

Profile w `eas.json`:
- `development` — z Dev Clientem, distribution internal
- `preview` — internal builds, iOS simulator + Android APK
- `production` — Store-ready (auto-increment build number)

**Free tier EAS:** repo jest publiczne, co kwalifikuje sie do darmowych priority builds (limity wg [docs.expo.dev](https://docs.expo.dev/eas/)).

## Powiazane

- Plan techniczny MVP: [`ready4docs:docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md`](https://github.com/ReadyNextOs/ready4docs/blob/main/docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md)
- QR Auth spec: [`ready4docs:docs/api/mobile-auth-qr.md`](https://github.com/ReadyNextOs/ready4docs/blob/main/docs/api/mobile-auth-qr.md)

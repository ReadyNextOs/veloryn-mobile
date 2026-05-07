# CLAUDE.md

Wytyczne dla Claude Code (claude.ai/code) przy pracy nad **Veloryn Mobile** — natywną aplikacją iOS + Android zbudowaną w React Native + Expo.

---

## Core Principles (TL;DR)

Trzy zasady nadpisujące wszystko poniżej w razie konfliktu:

1. **Simplicity First** — minimalny diff, brak spekulacyjnych abstrakcji ani feature flag „na zapas".
2. **No Laziness** — przyczyna źródłowa, nie łatka. Nie omijaj checków (`--no-verify`) żeby błąd „znikł".
3. **Minimal Impact** — dotykaj tylko tego, co konieczne. Brak pobocznych refaktoringów.

---

## Project Overview

**Veloryn Mobile** to natywna aplikacja mobilna dla systemu Veloryn (multi-tenant DMS/ERP). MVP scope:

1. **Auth** — parowanie urządzenia przez QR (zero hasła w apce, token Sanctum z webu)
2. **Mail** — czytanie skrzynki, podgląd, oznaczanie, załączniki (Sprint 2)
3. **Messenger** — wątki real-time przez Reverb (Sprint 3)

**Backend:** osobne repo [`ReadyNextOs/ready4docs`](https://github.com/ReadyNextOs/ready4docs) (private). Endpointy w `backend/routes/api.php`, plan techniczny w `docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md`.

**Bundle ID:** `pl.veloryn.app` (iOS + Android)
**Display name:** Veloryn

---

## Stack & Common Commands

```bash
# Pierwsze uruchomienie
npm install
cp .env.example .env
npx expo start

# Build APK (Android, internal distribution)
npx eas-cli@latest build --platform android --profile preview

# TypeScript
npx tsc --noEmit
```

| Warstwa | Technologia |
|---|---|
| Framework | React Native 0.79 + Expo SDK 53 |
| Routing | Expo Router v5 (file-based) |
| State server | TanStack Query v5 |
| State client | Zustand 5 + persist (SecureStore) |
| HTTP | axios + Sanctum Bearer |
| Auth | expo-secure-store (Keychain/Keystore) + expo-local-authentication (biometric) |
| QR scanner | expo-camera (CameraView, NIE deprecated BarCodeScanner) |
| i18n | i18next + react-i18next + expo-localization (5 języków) |
| Walidacja | Zod (na granicy systemu — QR payload, API responses) |
| Build | EAS Build (Expo cloud) — bez lokalnego Android SDK |

---

## Architektura

```
app/                       # Expo Router (file-based routing)
├── _layout.tsx            # Root: i18n + QueryClientProvider + biometric gate
├── index.tsx              # Splash / redirect (auth store)
├── locked.tsx             # Lock screen (biometric retry)
├── (auth)/
│   ├── _layout.tsx
│   └── pair.tsx           # QR scanner (expo-camera)
└── (tabs)/
    ├── _layout.tsx        # 3 zakładki: Mail, Messenger, Settings
    ├── mail/
    ├── messenger/
    └── settings.tsx
src/
├── api/
│   ├── client.ts          # axios singleton + Bearer + X-Tenant-Id + 401 interceptor
│   ├── auth.ts            # pairDevice() + getMe() (oddzielny axios.create)
│   └── errors.ts          # ApiError (oddzielony żeby uniknąć circular import)
├── lib/
│   ├── secureStorage.ts   # expo-secure-store wrapper (apiToken, apiHost, tenantId, userEmail)
│   ├── qrSchema.ts        # Zod QrPayloadV1 + parseQrPayload + isQrExpired
│   ├── i18n.ts            # i18next init z auto-detect języka
│   └── authEvents.ts      # event emitter dla auth:logout (dev-coupling)
├── store/
│   └── auth.ts            # Zustand: isPaired, user, tenant, isUnlocked, lastBackgroundedAt
├── hooks/
│   ├── usePairing.ts      # mutation: scan QR → pair API → save secure → navigate
│   └── useBiometricUnlock.ts  # biometric flow (czyta isUnlocked z Zustand)
├── types/                 # KOPIA z backend packages/shared-types
│   ├── auth.ts            # User, Tenant, MobileToken, QrPayloadV1
│   ├── mail.ts            # Email, Attachment, MailFolder
│   ├── messenger.ts       # Thread, Message, Reaction, MessengerBroadcastEvent
│   └── index.ts
└── i18n/{pl,en,cs,uk,es}/common.json  # 5 języków
assets/                    # placeholdery (icon, splash, adaptive-icon, favicon)
                           # do zastąpienia brand-zgodnymi przed produkcją
app.json                   # Expo config (bundle, plugins, permissions)
eas.json                   # EAS Build profiles (development/preview/production)
                           # preview: android.buildType=apk dla bezpośredniej instalacji
```

---

## Patterns & Conventions

### Auth flow

```
1. Web: user generuje QR (POST /api/auth/mobile-tokens) → wyświetla SVG
2. Mobile: app/(auth)/pair.tsx skanuje QR (expo-camera)
3. Mobile: parseQrPayload() (Zod) waliduje v=1, expires_at > now()
4. Mobile: pairDevice(payload) → POST /api/auth/mobile-tokens/pair
5. Mobile: po success → setSecure(apiToken, apiHost, tenantId), Zustand setAuthState
6. Mobile: redirect → /(tabs)/messenger
7. Background timeout 5 min → setUnlocked(false) → lock screen
```

### Reguły bezpieczeństwa

- **Token Bearer TYLKO w expo-secure-store** (Keychain/Keystore). Nigdy AsyncStorage.
- **Zustand persist** trzyma tylko lekkie metadane (`isPaired`, `apiHost`). `apiToken`/`tenantId` wyłącznie w SecureStore.
- **Token zapisujemy DOPIERO po confirmed pair** (`onSuccess` mutation, NIE `mutationFn`) — inaczej leak przy network error.
- **`X-Tenant-Id` header** automatyczny z SecureStore w `client.ts`. Pre-pair requests (`pairDevice`) używają osobnego `axios.create()` z tenant_id z QR payload.
- **401 interceptor**: `resetClient()` → `clearAllSecure()` → emit `auth:logout` → listener navigatuje do `/(auth)/pair`.
- **Biometric unlock** przez `useBiometricUnlock` (state w Zustand, NIE per-hook — inaczej dual instances rozjeżdżają stan).
- **5 min timeout** w background → wymusza re-biometric. AppState listener w `_layout.tsx`.

### TypeScript strict

- `strict: true`, `noUncheckedIndexedAccess`, `noImplicitReturns`. Zero `any`.
- Zod walidacja na granicy systemu (QR payload, response z /api/me, response z /pair). Nigdy `as` casting.
- Imports z aliasem `@/...` (z `tsconfig.json` paths).

### i18n (5 języków)

- **pl, en, cs, uk, es** — zawsze synchronizowane (memory `feedback_i18n_five_langs_grep_verify.md`).
- W `.tsx` używaj `useTranslation()` + `t('key')`. W `.ts` (utils, lib) — `i18n.t()`.
- **Nigdy nie hardkoduj user-facing tekstów** (Polski string w UI = bug).
- Klucze powinny być spójne strukturalnie z `frontend/src/i18n/locales/` na webie (te same nazewnictwa).

### Pliki

- **Max 200-300 linii** na plik. Ekstrahuj sub-komponenty/hooki gdy przekracza.
- **Komponenty React** w `app/` (routes) i `src/components/` (shared).
- **Logika biznesowa** w `src/hooks/` (React Query mutations, biometric, etc.).
- **Pure utils** w `src/lib/` (secureStorage, qrSchema, i18n, authEvents).

### React Query

- `refetchInterval` warunkowo (np. tylko gdy dialog otwarty).
- Selektywny `invalidateQueries({ queryKey: [...] })`. Nigdy bulk `invalidateQueries()`.
- Mutations: optimistic UI z rollback na error gdzie sensowne.

---

## ⚠️ Synchronizacja typów z backendem

`src/types/` to **kopia ręczna** z `packages/shared-types/src/` w repo `ready4docs`. Backend jest źródłem prawdy.

**Workflow przy zmianie API:**
1. Backend dev edytuje `packages/shared-types/src/{auth,mail,messenger}.ts` w ready4docs.
2. Skopiuj zmienione pliki do `veloryn-mobile/src/types/` (preserving file structure).
3. Adaptuj importy (web może mieć `@veloryn/shared-types` workspace import; mobile używa `@/types`).
4. Commit w mobile z referencją do commit hash backendu w body.

**Skrypt sync** (do zrobienia, task TYPES-002 z planu): `bin/sync-types.sh` z ready4docs do veloryn-mobile po `git pull` w obu.

---

## EAS Build

```bash
# Pierwsza inicjalizacja (jednorazowo)
npx eas-cli@latest init      # auto-konfiguruje projectId w app.json

# Build internal APK Android (testy ręczne)
npx eas-cli@latest build --platform android --profile preview

# Build production AAB (Play Store)
npx eas-cli@latest build --platform android --profile production

# Status buildu
npx eas-cli@latest build:view <build-id>
```

**Profile w `eas.json`:**
- `development` — dev client, distribution internal, dev API
- `preview` — `android.buildType=apk` dla instalacji ręcznej, dev API, internal distribution
- `production` — store-ready, auto-increment version, prod API

**Free tier EAS:** repo jest publiczne (`ReadyNextOs/veloryn-mobile`) → kwalifikacja do darmowych priority builds.

**Keystore Android** wygenerowany automatycznie w cloud (zapisany w EAS — nie zgubisz). Dla production sign config przez `eas credentials`.

---

## Git Workflow

### Quick rules

- **NIGDY** bez explicit zgody usera: `git reset --hard`, `git push --force`, `git clean -f*`, `git stash drop`, `git branch -D`, `--no-verify`.
- **Pre-flight przed każdą modyfikacją stanu:** `git status` + `git stash list`.
- **Po zmianach:** `npx tsc --noEmit` przed commit.
- **Convention commits:** lowercase subject max 72 chars. Brak `Changelog:` (to repo techniczne, nie biznesowe).
- **Branch:** `main`, push do origin po każdym commicie (osobne repo, nie shared workspace).

### Format commitu

```
<type>(<scope>): <subject lowercase, <72 chars>

Body opcjonalnie — opisuje WHY (motywacja, kontekst, link do planu).
```

Typy: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`.

---

## Memory & Learning

W przeciwieństwie do backendowego repo, mobile nie używa OMC `.omc/` infrastructure. Kontekst projektu utrzymywany w:
- `CLAUDE.md` (ten plik) — wytyczne dla Claude Code
- `README.md` — onboarding dla developera
- Plan techniczny w `ready4docs:docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md`

---

## Powiązane dokumenty

- **Plan techniczny MVP:** [`ready4docs:docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md`](https://github.com/ReadyNextOs/ready4docs/blob/main/docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md)
- **QR Auth spec:** [`ready4docs:docs/api/mobile-auth-qr.md`](https://github.com/ReadyNextOs/ready4docs/blob/main/docs/api/mobile-auth-qr.md)
- **Backend repo:** https://github.com/ReadyNextOs/ready4docs (private)
- **Expo dashboard:** https://expo.dev/accounts/milocha/projects/veloryn-mobile

---

## Sprint progress

- ✅ **Sprint 1** (RN-001..RN-008): bootstrap + QR pairing + biometric + tabs
- ⏳ **Sprint 2** (RN-009..RN-014): Mail MVP — folder list, message list, detail, attachments
- ⏳ **Sprint 3** (RN-015..RN-022): Messenger MVP — threads, messages, Reverb, push, settings
- ⏳ **Sprint 4** (RN-023..RN-025): hardening, EAS production builds, TestFlight + Play Internal

Statusy szczegółowe: `ready4docs:docs/plans/2026-05-07-mobile-mail-messenger-qr-mvp.md` sekcja 11.

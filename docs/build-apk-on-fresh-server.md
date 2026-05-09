# Build APK Veloryn Mobile na świeżym serwerze (Linux)

Stan zgodny z **Expo SDK 55 / React Native 0.83.6**.
Ostatnia aktualizacja: 2026-05-09 (po upgrade SDK 53 → 55).

---

## Wymagania systemowe

- **OS**: Linux x64 (Ubuntu 22.04+ / Debian 12+ rekomendowane).
- **RAM**: min. 8 GB (4 GB dla Gradle + 2 GB dla Metro/Hermes).
- **Dysk**: min. 20 GB wolnego (Gradle cache ~6 GB, Android SDK ~6 GB, node_modules ~1 GB).
- **Internet**: pierwszy build pobiera ~2 GB (Gradle, Maven, NDK).

---

## 1. Node.js 20 LTS

Ekosystem RN 0.83 / Expo SDK 55 jest stabilnie testowany z Node 20.x. Node 22.x zwykle działa, ale Node 25 może powodować subtelne problemy z natywnymi modułami (na deweloperskim serwerze chodzi, ale to nie referencja).

```bash
# Przez nvm (rekomendowane):
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Lub apt (Ubuntu/Debian):
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version  # powinno: v20.x.x
npm --version   # powinno: 10.x.x
```

---

## 2. JDK 17 (Temurin)

Gradle 9.0 (używany przez SDK 55) wymaga **minimum JDK 17**. JDK 21 też działa, ale 17 jest stabilną referencją.

```bash
# Adoptium repo:
sudo apt install -y wget apt-transport-https
wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | sudo gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg
echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | sudo tee /etc/apt/sources.list.d/adoptium.list
sudo apt update
sudo apt install -y temurin-17-jdk

# Sprawdź:
java -version  # openjdk 17.x.x

# Ustaw JAVA_HOME (do ~/.bashrc):
export JAVA_HOME=/usr/lib/jvm/temurin-17-jdk-amd64
export PATH=$JAVA_HOME/bin:$PATH
```

---

## 3. Android SDK

```bash
# Ścieżka instalacji
export ANDROID_HOME=/opt/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
sudo mkdir -p $ANDROID_HOME && sudo chown $USER:$USER $ANDROID_HOME

# Pobierz cmdline-tools
cd /tmp
wget https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip commandlinetools-linux-*.zip -d $ANDROID_HOME/cmdline-tools
mv $ANDROID_HOME/cmdline-tools/cmdline-tools $ANDROID_HOME/cmdline-tools/latest

# Dodaj do PATH (~/.bashrc)
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH

# Akceptuj licencje
yes | sdkmanager --licenses

# Zainstaluj wymagane komponenty (SDK 55 → API 35)
sdkmanager "platform-tools" \
           "platforms;android-35" \
           "build-tools;35.0.0" \
           "ndk;27.1.12297006"
```

NDK pobierze się też automatycznie przy pierwszym `gradlew` jeśli nie ma — ale ręczna instalacja przyspiesza pierwszy build.

---

## 4. Watchman (opcjonalnie, rekomendowane do dev)

Niewymagany do samego buildu APK, ale przyspiesza Metro/Expo dev server.

```bash
sudo apt install -y watchman
```

---

## 5. Sklonowanie repozytorium i konfiguracja env

```bash
git clone https://github.com/ReadyNextOs/veloryn-mobile.git
cd veloryn-mobile
npm ci --legacy-peer-deps   # CI używa --legacy-peer-deps ze względu na peer dep React 19
cp .env.example .env
```

Edytuj `.env`:

| Zmienna | Cel | Default |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Bazowy URL backendu | `https://dev.veloryn.pl` |
| `EXPO_PUBLIC_REVERB_KEY` | Reverb app key (broadcasting) | wymagane do messengera |
| `EXPO_PUBLIC_REVERB_HOST` | Reverb host | `reverb.veloryn.pl` |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN | opcjonalne; brak = no-op |
| `EXPO_PUBLIC_QR_PAIRING_TTL_SECONDS` | TTL QR po stronie mobile | `600` |
| `EXPO_PUBLIC_PUSH_ENABLED` | Włącz push notifications | `0` (off bez google-services.json) |
| `SENTRY_AUTH_TOKEN` | Source map upload (build env, nie .env) | opcjonalne |

---

## 6. Build APK (debug)

Wariant najszybszy, bez keystore — APK podpisany domyślnym `debug.keystore`.

```bash
# Regeneracja katalogów natywnych (CNG style — android/ jest w .gitignore)
npx expo prebuild --platform android --clean

# Build
cd android
./gradlew assembleDebug

# Output:
# android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 7. Build APK (release / produkcyjny)

Wymaga keystore. Przy braku — wygeneruj raz i przechowuj bezpiecznie.

```bash
# Wygeneruj keystore (jeśli nie ma):
keytool -genkeypair -v -storetype PKCS12 \
  -keystore veloryn-release.keystore \
  -alias veloryn -keyalg RSA -keysize 2048 -validity 10000

# Skonfiguruj android/gradle.properties (lub ENV):
# MYAPP_RELEASE_STORE_FILE=veloryn-release.keystore
# MYAPP_RELEASE_KEY_ALIAS=veloryn
# MYAPP_RELEASE_STORE_PASSWORD=<haslo>
# MYAPP_RELEASE_KEY_PASSWORD=<haslo>

cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

W razie produkcyjnego releasu rozważ AAB zamiast APK (`bundleRelease`) — Google Play od dawna preferuje.

---

## 8. EAS Build lokalny (alternatywa, rekomendowana w tym projekcie)

Memory projektu: domyślnie używamy `eas build --local`, nie cloud. EAS lokalnie używa Dockera, izolując środowisko.

```bash
# Wymagane dodatkowo:
sudo apt install -y docker.io jq
sudo usermod -aG docker $USER  # relog po tym

# Logowanie do EAS:
npx eas-cli@latest login

# Build:
npx eas-cli@latest build --platform android --profile preview --local
# APK pojawi się w bieżącym katalogu jako build-<timestamp>.apk
```

Profil `preview` w `eas.json` produkuje APK (nie AAB) gotowy do bezpośredniej instalacji.

---

## 9. Publikacja APK (workflow projektu)

Memory projektu: po każdym udanym buildzie kopiujemy APK do `/home/readynextos/public_html/apk/` jako `veloryn-mobile-latest.apk` i odświeżamy `latest.json` (index.html jest dynamiczny).

```bash
# Kopiowanie:
cp build-*.apk /home/readynextos/public_html/apk/veloryn-mobile-latest.apk

# Aktualizacja latest.json (sample):
cat > /home/readynextos/public_html/apk/latest.json <<EOF
{
  "version": "$(node -p "require('./package.json').version")",
  "build_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "size_bytes": $(stat -c '%s' /home/readynextos/public_html/apk/veloryn-mobile-latest.apk),
  "sha256": "$(sha256sum /home/readynextos/public_html/apk/veloryn-mobile-latest.apk | cut -d' ' -f1)"
}
EOF
```

---

## 10. Troubleshooting

| Symptom | Przyczyna | Rozwiązanie |
|---|---|---|
| `SDK location not found` | brak `ANDROID_HOME` lub `local.properties` | `export ANDROID_HOME=/opt/android-sdk` lub utwórz `android/local.properties` z `sdk.dir=...` |
| `Could not determine the dependencies of task ':app:compileDebugKotlin'` | brak NDK | `sdkmanager "ndk;27.1.12297006"` |
| `JAVA_HOME is not set` | brak Javy | sprawdź `java -version` i `export JAVA_HOME` |
| `Gradle build failed: heap space` | za mało RAM dla JVM | zwiększ `org.gradle.jvmargs=-Xmx4096m` w `android/gradle.properties` |
| Crash zaraz po loginie na urządzeniu | brak `google-services.json` + `EXPO_PUBLIC_PUSH_ENABLED=1` | ustaw `EXPO_PUBLIC_PUSH_ENABLED=0` lub dodaj Firebase config |
| `Module @sentry/react-native/expo not found` | stary plugin w app.json | sprawdź czy `app.json` ma tylko `@sentry/react-native` (po SDK 55) |
| `cacheDirectory does not exist on FileSystem` | nowy API w SDK 55 | użyj `expo-file-system/legacy` import |

---

## 11. Wersje referencyjne (po SDK 55 upgrade 2026-05-09)

| Komponent | Wersja |
|---|---|
| Expo SDK | 55.0.23 |
| React Native | 0.83.6 |
| React / React DOM | 19.2.0 |
| TypeScript | 5.9.2 |
| Reanimated | 4.2.1 |
| Worklets | 0.7.4 |
| Sentry RN | 7.11.0 |
| Gradle | 9.0.0 |
| compileSdk / targetSdk | 35 |
| minSdk | 24 |
| JDK | 17 (Temurin) |
| Node | 20 LTS |

---

## 12. CI workflow (referencja)

Repo zawiera `.github/workflows/build-android.yml` automatyzujący build debug APK przez GitHub Actions. Bazuje na:

- `actions/setup-node@v4` z node 20
- `actions/setup-java@v4` z JDK 17 (Temurin)
- `android-actions/setup-android@v3` (SDK platform-35 + build-tools)
- `npm ci --legacy-peer-deps`
- `expo prebuild --platform android --no-install --clean`
- `./gradlew assembleDebug`

APK ląduje jako workflow artifact (14 dni retention).

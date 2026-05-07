// i18next init — 5 języków: pl, en, cs, uk, es.
// Import tego pliku na samym początku (app/_layout.tsx) żeby init był early.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';

import plCommon from '@/i18n/pl/common.json';
import enCommon from '@/i18n/en/common.json';
import csCommon from '@/i18n/cs/common.json';
import ukCommon from '@/i18n/uk/common.json';
import esCommon from '@/i18n/es/common.json';

const SUPPORTED_LANGUAGES = ['pl', 'en', 'cs', 'uk', 'es'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Musi być identyczny z kluczem w LanguagePicker.tsx */
const LANG_STORE_KEY = 'veloryn.language';

function detectLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    const deviceLang = locales[0]?.languageCode ?? 'pl';
    if ((SUPPORTED_LANGUAGES as readonly string[]).includes(deviceLang)) {
      return deviceLang as SupportedLanguage;
    }
  } catch {
    // expo-localization może rzucić poza Expo Go — fallback
  }
  return 'pl';
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    lng: detectLanguage(),
    fallbackLng: 'pl',
    supportedLngs: [...SUPPORTED_LANGUAGES],
    ns: ['common'],
    defaultNS: 'common',
    resources: {
      pl: { common: plCommon },
      en: { common: enCommon },
      cs: { common: csCommon },
      uk: { common: ukCommon },
      es: { common: esCommon },
    },
    interpolation: {
      escapeValue: false, // React Native nie wymaga HTML escapowania
    },
  });

  // Async: po synchronicznym init odczytaj zapisaną preferencję i przełącz
  // jeśli różna od device locale (eliminuje utratę języka na cold start).
  SecureStore.getItemAsync(LANG_STORE_KEY)
    .then((stored) => {
      if (
        stored &&
        stored !== i18n.language &&
        (SUPPORTED_LANGUAGES as readonly string[]).includes(stored)
      ) {
        void i18n.changeLanguage(stored);
      }
    })
    .catch(() => {
      // silent — zostaje device locale jako fallback
    });
}

export default i18n;

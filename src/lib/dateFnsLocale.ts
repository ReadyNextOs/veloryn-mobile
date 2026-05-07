// Mapuje kod języka i18n na obiekt locale date-fns.
// Używane w komponentach formatujących daty względne (ThreadRow, MessageBubble).

import { pl, enUS, cs, uk, es } from 'date-fns/locale';
import type { Locale } from 'date-fns';

const LOCALE_MAP: Record<string, Locale> = {
  pl,
  en: enUS,
  cs,
  uk,
  es,
};

export function getDateFnsLocale(language: string): Locale {
  return LOCALE_MAP[language] ?? enUS;
}

import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

const LANG_STORE_KEY = 'veloryn.language';

interface Language {
  code: string;
  label: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
];

export function LanguagePicker() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.slice(0, 2) ?? 'pl';

  const handleSelect = useCallback(async (code: string) => {
    await i18n.changeLanguage(code);
    await SecureStore.setItemAsync(LANG_STORE_KEY, code);
  }, [i18n]);

  return (
    <>
      {LANGUAGES.map((lang, idx) => (
        <TouchableOpacity
          key={lang.code}
          style={[
            styles.row,
            idx < LANGUAGES.length - 1 && styles.rowBorder,
          ]}
          onPress={() => void handleSelect(lang.code)}
          activeOpacity={0.7}
        >
          <Text style={styles.flag}>{lang.flag}</Text>
          <Text style={styles.label}>{lang.label}</Text>
          {currentLang === lang.code && (
            <MaterialCommunityIcons name="check" size={20} color="#1976d2" />
          )}
        </TouchableOpacity>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  flag: {
    fontSize: 20,
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(0,0,0,0.87)',
  },
});

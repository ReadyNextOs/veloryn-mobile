import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ModuleConfig } from '@/config/modules';

interface Props {
  module: ModuleConfig;
}

export function EmptyModulePlaceholder({ module }: Props) {
  const { t } = useTranslation('common');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(app)/dashboard');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={module.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={56}
          color="#7a24a1"
        />
      </View>
      <Text style={styles.moduleName}>{t(module.labelKey)}</Text>
      <Text style={styles.title}>{t('modules.placeholder.title')}</Text>
      <Text style={styles.description}>{t('modules.placeholder.description')}</Text>

      <TouchableOpacity style={styles.button} onPress={handleBack} activeOpacity={0.75}>
        <MaterialCommunityIcons name="arrow-left" size={18} color="#fff" />
        <Text style={styles.buttonText}>{t('modules.placeholder.goBack')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: '#fafafa',
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(122,36,161,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  moduleName: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.87)',
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.55)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    maxWidth: 320,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 12,
    backgroundColor: '#7a24a1',
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

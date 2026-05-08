import React from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { EmptyModulePlaceholder } from '@/components/shell/EmptyModulePlaceholder';
import { getModuleBySlug } from '@/config/modules';

export default function ModulePlaceholderScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t } = useTranslation('common');
  const module = slug ? getModuleBySlug(slug) : undefined;

  if (!module) {
    return (
      <>
        <Stack.Screen options={{ title: t('modules.placeholder.title') }} />
        <EmptyModulePlaceholder
          module={{
            slug: 'unknown',
            desktopPath: '/',
            labelKey: 'modules.placeholder.title',
            icon: 'help-circle-outline',
            iconLucide: 'HelpCircle',
            hasNativeImpl: false,
          }}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t(module.labelKey) }} />
      <EmptyModulePlaceholder module={module} />
    </>
  );
}

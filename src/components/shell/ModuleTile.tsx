import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ModuleConfig } from '@/config/modules';

interface Props {
  module: ModuleConfig;
  onPress: (module: ModuleConfig) => void;
}

export const ModuleTile = React.memo(function ModuleTile({ module, onPress }: Props) {
  const { t } = useTranslation('common');
  const handlePress = React.useCallback(() => onPress(module), [module, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <MaterialCommunityIcons
          name={module.icon as keyof typeof MaterialCommunityIcons.glyphMap}
          size={28}
          color="#7a24a1"
        />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {t(module.labelKey)}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 96,
    margin: 4,
    paddingVertical: 14,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: '#f5f0f7',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(122,36,161,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.75)',
    textAlign: 'center',
    lineHeight: 15,
  },
});

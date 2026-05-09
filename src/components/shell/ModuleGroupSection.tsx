import React, { useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ModuleConfig, ModuleGroupConfig } from '@/config/modules';
import { ModuleTile } from './ModuleTile';

interface Props {
  group: ModuleGroupConfig;
  modules: ModuleConfig[];
  onModulePress: (module: ModuleConfig) => void;
  initiallyCollapsed?: boolean;
}

export const ModuleGroupSection = React.memo(function ModuleGroupSection({
  group,
  modules,
  onModulePress,
  initiallyCollapsed = false,
}: Props) {
  const { t } = useTranslation('common');
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((c) => !c);
  };

  if (modules.length === 0) return null;

  return (
    <View style={styles.section}>
      <Pressable onPress={toggle} style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons
            name={group.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={18}
            color="rgba(0,0,0,0.6)"
          />
          <Text style={styles.title}>{t(group.labelKey)}</Text>
          <Text style={styles.count}>{modules.length}</Text>
        </View>
        <MaterialCommunityIcons
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={20}
          color="rgba(0,0,0,0.4)"
        />
      </Pressable>

      {!collapsed && (
        <View style={styles.grid}>
          {chunkInRows(modules, 3).map((row, rowIdx) => (
            <View key={rowIdx} style={styles.row}>
              {row.map((mod) => (
                <ModuleTile key={mod.slug} module={mod} onPress={onModulePress} />
              ))}
              {row.length < 3 &&
                Array.from({ length: 3 - row.length }).map((_, i) => (
                  <View key={`pad-${i}`} style={styles.tilePad} />
                ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

function chunkInRows<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
    textTransform: 'uppercase',
  },
  count: {
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 18,
    textAlign: 'center',
  },
  grid: {
    paddingHorizontal: 8,
  },
  row: {
    flexDirection: 'row',
  },
  tilePad: {
    flex: 1,
    margin: 4,
  },
});

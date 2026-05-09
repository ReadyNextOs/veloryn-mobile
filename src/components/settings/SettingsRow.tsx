import React from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type RowVariant = 'navigation' | 'toggle' | 'info' | 'destructive';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

interface BaseProps {
  label: string;
  sublabel?: string;
  icon?: IconName;
  variant?: RowVariant;
  isLast?: boolean;
}

interface NavigationProps extends BaseProps {
  variant?: 'navigation';
  onPress: () => void;
}

interface ToggleProps extends BaseProps {
  variant: 'toggle';
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

interface InfoProps extends BaseProps {
  variant: 'info';
  value?: string;
}

interface DestructiveProps extends BaseProps {
  variant: 'destructive';
  onPress: () => void;
}

type Props = NavigationProps | ToggleProps | InfoProps | DestructiveProps;

export function SettingsRow(props: Props) {
  const { label, sublabel, icon, variant = 'navigation', isLast = false } = props;
  const isDestructive = variant === 'destructive';

  const content = (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      {icon ? (
        <View style={styles.iconWrapper}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={isDestructive ? '#d32f2f' : '#7a24a1'}
          />
        </View>
      ) : null}

      <View style={styles.textGroup}>
        <Text
          style={[styles.label, isDestructive && styles.labelDestructive]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.sublabel} numberOfLines={2}>
            {sublabel}
          </Text>
        ) : null}
      </View>

      {variant === 'toggle' && (
        <Switch
          value={(props as ToggleProps).value}
          onValueChange={(props as ToggleProps).onValueChange}
          disabled={(props as ToggleProps).disabled}
          trackColor={{ true: '#7a24a1', false: undefined }}
          style={styles.toggle}
        />
      )}

      {variant === 'navigation' && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color="rgba(0,0,0,0.3)"
        />
      )}

      {variant === 'info' && (props as InfoProps).value ? (
        <Text style={styles.infoValue} numberOfLines={1}>
          {(props as InfoProps).value}
        </Text>
      ) : null}
    </View>
  );

  if (variant === 'toggle' || variant === 'info') {
    return content;
  }

  return (
    <TouchableOpacity
      onPress={(props as NavigationProps | DestructiveProps).onPress}
      activeOpacity={0.7}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  textGroup: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: 'rgba(0,0,0,0.87)',
  },
  labelDestructive: {
    color: '#d32f2f',
  },
  sublabel: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  toggle: {
    marginLeft: 8,
  },
  infoValue: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    marginLeft: 8,
  },
});

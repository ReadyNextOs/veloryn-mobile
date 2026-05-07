import React from 'react';
import { StyleSheet, View } from 'react-native';

function SkeletonBlock({
  width,
  height = 12,
}: {
  width: number | string;
  height?: number;
}) {
  return (
    <View
      style={[
        styles.base,
        {
          width: typeof width === 'number' ? width : undefined,
          height,
          flex: width === '100%' ? 1 : undefined,
        },
      ]}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <SkeletonBlock width="55%" height={12} />
        <View style={{ height: 4 }} />
        <SkeletonBlock width="80%" height={11} />
        <View style={{ height: 4 }} />
        <SkeletonBlock width="65%" height={11} />
      </View>
    </View>
  );
}

export function MailMessageSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <SkeletonRow key={i} />
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
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
    flexShrink: 0,
  },
  lines: {
    flex: 1,
  },
  base: {
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
});

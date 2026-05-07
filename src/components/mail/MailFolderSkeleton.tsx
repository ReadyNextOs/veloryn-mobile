import React from 'react';
import { StyleSheet, View } from 'react-native';

function SkeletonLine({ width, height = 14 }: { width: number | string; height?: number }) {
  return (
    <View
      style={[
        styles.skeletonBase,
        { width: typeof width === 'number' ? width : undefined, height, flex: typeof width === 'string' ? 1 : undefined },
      ]}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <View style={styles.iconPlaceholder} />
      <SkeletonLine width="60%" />
    </View>
  );
}

export function MailFolderSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
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
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  iconPlaceholder: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonBase: {
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
});

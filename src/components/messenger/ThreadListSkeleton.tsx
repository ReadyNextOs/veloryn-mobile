import React from 'react';
import { StyleSheet, View } from 'react-native';

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
  return (
    <View
      style={[
        styles.block,
        { width: width as number, height },
        style ?? {},
      ]}
    />
  );
}

function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonBlock width={44} height={44} style={styles.avatar} />
      <View style={styles.lines}>
        <SkeletonBlock width="60%" height={14} style={styles.line} />
        <SkeletonBlock width="85%" height={12} style={styles.line} />
      </View>
    </View>
  );
}

export function ThreadListSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
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
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  avatar: {
    borderRadius: 22,
    marginRight: 12,
    flexShrink: 0,
  },
  lines: {
    flex: 1,
  },
  line: {
    borderRadius: 4,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  block: {
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SkeletonBubbleProps {
  align: 'left' | 'right';
  width: number;
  withAvatar?: boolean;
}

function SkeletonBubble({ align, width, withAvatar = false }: SkeletonBubbleProps) {
  return (
    <View style={[styles.row, align === 'right' ? styles.rowRight : styles.rowLeft]}>
      {withAvatar && align === 'left' && (
        <View style={styles.skeletonAvatar} />
      )}
      <View style={[styles.bubble, { width }]} />
    </View>
  );
}

export function MessageListSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBubble align="left" width={200} withAvatar />
      <SkeletonBubble align="right" width={140} />
      <SkeletonBubble align="left" width={160} withAvatar />
      <SkeletonBubble align="left" width={220} />
      <SkeletonBubble align="right" width={180} />
      <SkeletonBubble align="right" width={100} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-end',
  },
  rowLeft: {
    justifyContent: 'flex-start',
  },
  rowRight: {
    justifyContent: 'flex-end',
  },
  skeletonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginRight: 6,
    flexShrink: 0,
  },
  bubble: {
    height: 36,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
});

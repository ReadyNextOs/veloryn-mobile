import * as React from 'react';
import { Text as RNText, type TextProps } from 'react-native';
import { cn } from '@/lib/utils';

type Props = TextProps & { className?: string; ref?: React.Ref<RNText> };

export function Text({ className, ref, ...props }: Props) {
  return (
    <RNText
      ref={ref}
      className={cn('text-base text-foreground', className)}
      {...props}
    />
  );
}

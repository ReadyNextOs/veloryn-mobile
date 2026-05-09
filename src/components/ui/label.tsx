import * as React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

type LabelProps = React.ComponentPropsWithoutRef<typeof Text> & {
  ref?: React.Ref<React.ComponentRef<typeof Text>>;
};

export function Label({ className, ref, ...props }: LabelProps) {
  return (
    <Text
      ref={ref}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  );
}

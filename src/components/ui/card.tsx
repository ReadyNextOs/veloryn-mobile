import * as React from 'react';
import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

type ViewCardProps = ViewProps & { className?: string; ref?: React.Ref<View> };
type TextCardProps = React.ComponentPropsWithoutRef<typeof Text> & {
  ref?: React.Ref<React.ComponentRef<typeof Text>>;
};

export function Card({ className, ref, ...props }: ViewCardProps) {
  return (
    <View
      ref={ref}
      className={cn('rounded-lg border border-border bg-card', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ref, ...props }: ViewCardProps) {
  return <View ref={ref} className={cn('p-4', className)} {...props} />;
}

export function CardTitle({ className, ref, ...props }: TextCardProps) {
  return (
    <Text
      ref={ref}
      className={cn('text-base font-semibold text-card-foreground', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ref, ...props }: TextCardProps) {
  return (
    <Text
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ref, ...props }: ViewCardProps) {
  return <View ref={ref} className={cn('px-4 pb-4', className)} {...props} />;
}

export function CardFooter({ className, ref, ...props }: ViewCardProps) {
  return (
    <View
      ref={ref}
      className={cn('flex-row items-center p-4 pt-0', className)}
      {...props}
    />
  );
}

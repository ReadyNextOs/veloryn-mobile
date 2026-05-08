import * as React from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<
  TextInput,
  TextInputProps & { className?: string }
>(({ className, ...props }, ref) => (
  <TextInput
    ref={ref}
    className={cn(
      'h-10 rounded-md border border-input bg-background px-3 text-base text-foreground',
      'web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring',
      className,
    )}
    placeholderTextColor="hsl(0 0% 45.1%)"
    {...props}
  />
));
Input.displayName = 'Input';

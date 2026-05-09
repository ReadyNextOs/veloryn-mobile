import * as React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  View,
  type ViewProps,
} from 'react-native';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/text';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet(): SheetContextValue {
  const ctx = React.use(SheetContext);
  if (!ctx) throw new Error('Sheet components must be used inside <Sheet />');
  return ctx;
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext value={{ open, onOpenChange }}>{children}</SheetContext>
  );
}

interface SheetContentProps extends ViewProps {
  className?: string;
  side?: 'bottom' | 'top';
  children: React.ReactNode;
}

export function SheetContent({
  className,
  side = 'bottom',
  children,
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = useSheet();

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={() => onOpenChange(false)}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className={cn('flex-1', side === 'bottom' ? 'justify-end' : 'justify-start')}
      >
        <Pressable
          onPress={() => onOpenChange(false)}
          className="absolute inset-0 bg-black/50"
        />
        <View
          className={cn(
            'bg-background p-6',
            side === 'bottom' ? 'rounded-t-lg' : 'rounded-b-lg',
            className,
          )}
          {...props}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function SheetHeader({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('mb-4 gap-1', className)} {...props} />;
}

type SheetTextProps = React.ComponentPropsWithoutRef<typeof Text> & {
  ref?: React.Ref<React.ComponentRef<typeof Text>>;
};

export function SheetTitle({ className, ref, ...props }: SheetTextProps) {
  return (
    <Text
      ref={ref}
      className={cn('text-lg font-semibold text-foreground', className)}
      {...props}
    />
  );
}

export function SheetDescription({ className, ref, ...props }: SheetTextProps) {
  return (
    <Text
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function SheetFooter({ className, ...props }: ViewProps & { className?: string }) {
  return (
    <View className={cn('mt-4 flex-row justify-end gap-2', className)} {...props} />
  );
}

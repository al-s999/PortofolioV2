import { cn } from '@/lib/utils/cn';
import { forwardRef } from 'react';
import { View, ViewProps } from 'react-native';

interface SeparatorProps extends ViewProps {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
  className?: string;
}

export const Separator = forwardRef<View, SeparatorProps>(
  ({ orientation = 'horizontal', decorative = true, className, style, ...props }, ref) => (
    <View
      ref={ref}
      role={decorative ? 'separator' : undefined}
      aria-orientation={orientation}
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        orientation === 'horizontal' ? 'w-full h-px' : 'h-full w-px',
        className
      )}
      style={style}
      {...props}
    />
  )
);

Separator.displayName = 'Separator';
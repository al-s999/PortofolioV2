import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode } from 'react';
import { View, ViewProps, Text, TextProps } from 'react-native';

interface BadgeProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variants = {
  default: {
    container: 'bg-primary-100 dark:bg-primary-900',
    text: 'text-primary-800 dark:text-primary-200',
  },
  secondary: {
    container: 'bg-gray-200 dark:bg-gray-800', // Adjusted light background for better contrast
    text: 'text-gray-800 dark:text-gray-200',
  },
  success: {
    container: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-800 dark:text-green-200',
  },
  warning: {
    container: 'bg-yellow-100 dark:bg-yellow-900',
    text: 'text-yellow-800 dark:text-yellow-200',
  },
  destructive: {
    container: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-800 dark:text-red-200',
  },
  outline: {
    container: 'border border-gray-300 dark:border-gray-600 bg-transparent',
    text: 'text-gray-700 dark:text-gray-300',
  },
};

const sizes = {
  sm: { container: 'px-2 py-0.5', text: 'text-xs' },
  md: { container: 'px-2.5 py-1', text: 'text-sm' },
  lg: { container: 'px-3 py-1.5', text: 'text-base' },
};

export const Badge = forwardRef<View, BadgeProps>(
  ({ children, variant = 'default', size = 'md', className, style, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'inline-flex flex-row items-center justify-center font-medium rounded-full',
        variants[variant].container,
        sizes[size].container,
        className
      )}
      style={style}
      {...props}
    >
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text className={cn(variants[variant].text, sizes[size].text, 'font-medium')}>{children}</Text>
      ) : (
        children
      )}
    </View>
  )
);

Badge.displayName = 'Badge';
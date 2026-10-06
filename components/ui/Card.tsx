import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode, HTMLAttributes } from 'react';
import { View, ViewProps, Text, Pressable, PressableProps } from 'react-native';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  onPress?: () => void;
}

const variants = {
  default: 'bg-white dark:bg-dark-surface shadow-sm',
  outlined: 'bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border',
  elevated: 'bg-white dark:bg-dark-surface shadow-lg',
};

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export const Card = forwardRef<View, CardProps>(
  ({ children, variant = 'default', padding = 'md', hover = false, onPress, className, style, ...props }, ref) => {
    const Component = onPress ? Pressable : View;
    
    return (
      <Component
        ref={ref}
        onPress={onPress}
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-200',
          variants[variant],
          paddings[padding],
          hover && 'hover:shadow-md hover:-translate-y-0.5 active:translate-y-0',
          onPress && 'cursor-pointer active:scale-[0.98]',
          className
        )}
        style={style}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef<View, ViewProps & { className?: string }>(
  ({ children, className, style, ...props }, ref) => (
    <View ref={ref} className={cn('mb-4', className)} style={style} {...props}>
      {children}
    </View>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<Text, { className?: string; children: ReactNode; style?: any }>(
  ({ children, className, style, ...props }, ref) => (
    <Text ref={ref} className={cn('text-xl font-semibold text-gray-900 dark:text-gray-100', className)} style={style} {...props}>
      {children}
    </Text>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<Text, { className?: string; children: ReactNode; style?: any }>(
  ({ children, className, style, ...props }, ref) => (
    <Text ref={ref} className={cn('mt-1 text-sm text-gray-500 dark:text-gray-400', className)} style={style} {...props}>
      {children}
    </Text>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<View, ViewProps & { className?: string }>(
  ({ children, className, style, ...props }, ref) => (
    <View ref={ref} className={cn(className)} style={style} {...props}>
      {children}
    </View>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<View, ViewProps & { className?: string }>(
  ({ children, className, style, ...props }, ref) => (
    <View ref={ref} className={cn('mt-4 flex-row items-center justify-end gap-2', className)} style={style} {...props}>
      {children}
    </View>
  )
);
CardFooter.displayName = 'CardFooter';
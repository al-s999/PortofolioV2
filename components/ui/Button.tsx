import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode } from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';

interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'destructive-ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  primary: {
    container: 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800',
    text: 'text-white',
  },
  secondary: {
    container: 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700',
    text: 'text-gray-900 dark:text-gray-100',
  },
  outline: {
    container: 'border-2 border-gray-300 hover:bg-gray-100 active:bg-gray-200 dark:border-gray-600 dark:hover:bg-gray-800 bg-transparent',
    text: 'text-gray-700 dark:text-gray-300',
  },
  ghost: {
    container: 'hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-800 bg-transparent',
    text: 'text-gray-700 dark:text-gray-300',
  },
  destructive: {
    container: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
    text: 'text-white',
  },
  'destructive-ghost': {
    container: 'hover:bg-red-50 active:bg-red-100 dark:hover:bg-red-900/20 dark:active:bg-red-900/30 bg-transparent',
    text: 'text-red-600 dark:text-red-400',
  },
};

const sizes = {
  sm: { container: 'px-3 py-1.5 gap-1.5', text: 'text-sm' },
  md: { container: 'px-4 py-2 gap-2', text: 'text-base' },
  lg: { container: 'px-6 py-3 gap-2.5', text: 'text-lg' },
};

export const Button = forwardRef<View, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    
    return (
      <TouchableOpacity
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex flex-row items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant].container,
          sizes[size].container,
          fullWidth && 'w-full',
          className
        )}
        style={style}
        activeOpacity={0.8}
        {...props}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' || variant === 'destructive' ? '#fff' : '#000'} />
        ) : (
          <>
            {leftIcon && <Text className={cn("flex-shrink-0", variants[variant].text)}>{leftIcon}</Text>}
            <Text className={cn('font-medium', variants[variant].text, sizes[size].text)}>
              {children}
            </Text>
            {rightIcon && <Text className={cn("flex-shrink-0", variants[variant].text)}>{rightIcon}</Text>}
          </>
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';
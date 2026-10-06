import { cn } from '@/lib/utils/cn';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface InputProps extends Omit<TextInputProps, 'children' | 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  rightElement?: ReactNode;
  className?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      rightElement,
      className,
      style,
      placeholder,
      value,
      onChangeText,
      ...props
    },
    ref
  ) => {
    const inputId = `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    
    return (
      <View className={cn('w-full', className)}>
        {label && (
          <Text
            id={`${inputId}-label`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </Text>
        )}
        <View className="relative">
          {leftIcon && (
            <View className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            id={inputId}
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border transition-colors',
              'bg-white dark:bg-dark-bg',
              'border-gray-300 dark:border-dark-border',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
              leftIcon && 'pl-10',
              (rightIcon || rightElement) && 'pr-10',
            )}
            style={style}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            {...props}
          />
          {rightIcon && (
            <View className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              {rightIcon}
            </View>
          )}
          {rightElement && !rightIcon && (
            <View className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
              {rightElement}
            </View>
          )}
        </View>
        {error && (
          <Text id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </Text>
        )}
        {helperText && !error && (
          <Text id={helperId} className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            {helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';
import { cn } from '@/lib/utils/cn';
import { forwardRef, TextareaHTMLAttributes, ReactNode } from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

interface TextareaProps extends Omit<TextInputProps, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  className?: string;
  rows?: number;
}

export const Textarea = forwardRef<TextInput, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      className,
      style,
      placeholder,
      value,
      onChangeText,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const textareaId = `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    return (
      <View className={cn('w-full shrink-0 self-start', className)}>
        {label && (
          <Text
            id={`${textareaId}-label`}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          id={textareaId}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          multiline
          numberOfLines={rows}
          textAlignVertical="top"
          scrollEnabled
          className={cn(
            'w-full px-4 py-3 rounded-lg border transition-colors resize-none',
            'bg-white dark:bg-dark-bg',
            'border-gray-300 dark:border-dark-border',
            'text-gray-900 dark:text-gray-100',
            'placeholder:text-gray-400 dark:placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
          )}
          style={[{ minHeight: 120, maxHeight: 200, textAlignVertical: 'top' }, style]}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          {...props}
        />
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

Textarea.displayName = 'Textarea';
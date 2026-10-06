import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode, useState, useRef, useEffect } from 'react';
import { View, ViewProps, Text, TextProps, Pressable, FlatList, StyleSheet, Animated, Easing, Keyboard, TextInput, Platform } from 'react-native';
import { ChevronDown, ChevronUp, X, Check } from './LucideIcon';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends ViewProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  clearable?: boolean;
  leftIcon?: ReactNode;
}

export const Select = forwardRef<View, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      placeholder = 'Select an option',
      value,
      onChange,
      options,
      disabled = false,
      required = false,
      className,
      searchable = false,
      clearable = false,
      leftIcon,
      style,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<View>(null);
    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : options;

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
      if (Platform.OS !== 'web') return;
      const handleKeyDown = (event: any) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        Keyboard.dismiss();
        document.addEventListener('keydown', handleKeyDown);
      }
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const handleSelect = (option: SelectOption) => {
      if (!option.disabled) {
        onChange?.(option.value);
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleClear = () => {
      onChange?.('');
      setIsOpen(false);
    };

    const toggleOpen = () => {
      if (!disabled) setIsOpen((prev) => !prev);
    };

    return (
      <View className={cn('w-full', isOpen && 'z-50', className)} style={[style, isOpen && { zIndex: 50 }]} {...props}>
        {label && (
          <Text
            id={`${selectId}-label`}
            className={cn(
              'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5',
              required && 'text-red-500'
            )}
          >
            {label}
            {required && <Text className="text-red-500 ml-1" aria-hidden={true}>*</Text>}
          </Text>
        )}
        <View className="relative">
          <Pressable
            ref={ref}
            onPress={toggleOpen}
            disabled={disabled}
            className={cn(
              'w-full flex-row items-center justify-between px-4 py-2.5 rounded-lg border transition-colors',
              'bg-white dark:bg-dark-bg',
              'border-gray-300 dark:border-dark-border',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
              error && 'border-red-500 focus:ring-red-500',
            )}
            style={{ minHeight: 48 }}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${selectId}-listbox`}
            aria-activedescendant={value ? `${selectId}-option-${value}` : undefined}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
          >
            <View className="flex-1 flex-row items-center gap-3 min-w-0">
              {leftIcon && (
                <View className="text-gray-400 pointer-events-none">
                  {leftIcon}
                </View>
              )}
              {value ? (
                <Text className="flex-1 text-gray-900 dark:text-gray-100 truncate">
                  {selectedOption?.label ?? value}
                </Text>
              ) : (
                <Text className="flex-1 text-gray-400 dark:text-gray-500 truncate">
                  {placeholder}
                </Text>
              )}
              {clearable && value && (
                <Pressable onPress={handleClear} className="p-1 -mr-2" accessibilityLabel="Clear selection">
                  <X size={18} stroke="gray" />
                </Pressable>
              )}
            </View>
            <View className="flex-row items-center gap-2">
              {isOpen ? <ChevronUp size={20} stroke="gray" /> : <ChevronDown size={20} stroke="gray" />}
            </View>
          </Pressable>

          {isOpen && (
            <View
              ref={dropdownRef}
              className="absolute top-full left-0 z-50 w-full mt-1 bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border rounded-lg shadow-lg overflow-hidden max-h-64"
              id={`${selectId}-listbox`}
              accessibilityRole="list"
              aria-label={label}
            >
              {searchable && (
                <View className="px-3 py-2 border-b border-gray-200 dark:border-dark-border">
                  <TextInput
                    placeholder="Search..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 placeholder-gray-400"
                    autoFocus
                  />
                </View>
              )}
              <FlatList
                data={filteredOptions}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    disabled={item.disabled}
                    className={cn(
                      'px-4 py-3 flex-row items-center justify-between',
                      'hover:bg-gray-100 dark:hover:bg-dark-surface/80',
                      'first:rounded-t-lg last:rounded-b-lg',
                      item.disabled && 'opacity-50',
                      value === item.value && 'bg-primary-50 dark:bg-primary-900/30'
                    )}
                    role="option"
                    aria-selected={value === item.value}
                    aria-disabled={item.disabled}
                    id={`${selectId}-option-${item.value}`}
                  >
                    <Text
                      className={cn(
                        'flex-1 truncate',
                        value === item.value
                          ? 'text-primary-700 dark:text-primary-300 font-medium'
                          : 'text-gray-900 dark:text-gray-100',
                        item.disabled && 'text-gray-400 dark:text-gray-500'
                      )}
                    >
                      {item.label}
                    </Text>
                    {value === item.value && <Check size={20} stroke="primary" />}
                  </Pressable>
                )}
                ItemSeparatorComponent={() => (
                  <View className="h-px bg-gray-200 dark:bg-dark-border" />
                )}
                ListEmptyComponent={
                  <View className="px-4 py-8 align-center">
                    <Text className="text-gray-500 dark:text-gray-400 text-center">
                      {searchable ? 'No options found' : 'No options available'}
                    </Text>
                  </View>
                }
              />
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

Select.displayName = 'Select';

const styles = StyleSheet.create({});
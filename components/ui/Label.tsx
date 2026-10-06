import { cn } from '@/lib/utils/cn';
import { forwardRef, LabelHTMLAttributes } from 'react';
import { Text, TextProps } from 'react-native';

interface LabelProps extends TextProps {
  required?: boolean;
  className?: string;
}

export const Label = forwardRef<Text, LabelProps>(
  ({ children, required = false, className, style, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5',
        className
      )}
      style={style}
      {...props}
    >
      {children}
      {required && <Text className="text-red-500 ml-1" aria-hidden={true}>*</Text>}
    </Text>
  )
);

Label.displayName = 'Label';
import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode } from 'react';
import { View, ViewProps, Text, TextProps, Image, ImageProps } from 'react-native';
import { getInitials } from '@/lib/utils/cn';

interface AvatarProps extends ViewProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  fallback?: ReactNode;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-2xl',
};

export const Avatar = forwardRef<View, AvatarProps>(
  ({ src, alt, name, size = 'md', shape = 'circle', fallback, className, style, ...props }, ref) => {
    const sizeClass = sizes[size];
    const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';
    
    if (src) {
      return (
        <View
          ref={ref}
          className={cn('relative overflow-hidden bg-gray-100 dark:bg-gray-800', sizeClass, shapeClass, className)}
          style={style}
          {...props}
        >
          <Image
            source={{ uri: src }}
            alt={alt ?? name ?? 'Avatar'}
            className={cn('w-full h-full object-cover', shapeClass)}
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      );
    }
    
    const initials = name ? getInitials(name) : '?';
    const bgColors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500',
      'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-sky-500',
      'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
      'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500',
    ];
    
    const colorIndex = name ? name.charCodeAt(0) % bgColors.length : 0;
    const bgColor = bgColors[colorIndex];
    
    return (
      <View
        ref={ref}
        className={cn(
          'flex items-center justify-center font-medium text-white',
          sizeClass,
          shapeClass,
          bgColor,
          className
        )}
        style={style}
        {...props}
      >
        {fallback ?? <Text>{initials}</Text>}
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

export const AvatarGroup = forwardRef<View, ViewProps & { max?: number; className?: string }>(
  ({ children, max = 5, className, style, ...props }, ref) => {
    const childArray = Array.isArray(children) ? children : [children];
    const visibleChildren = childArray.slice(0, max);
    const remainingCount = childArray.length - max;
    
    return (
      <View ref={ref} className={cn('flex-row -space-x-2', className)} style={style} {...props}>
        {visibleChildren.map((child, index) => (
          <View key={index} className="relative z-[auto]">
            {child}
          </View>
        ))}
        {remainingCount > 0 && (
          <View className={cn('relative z-0', sizes.md, 'rounded-full', 'bg-gray-100 dark:bg-gray-800', 'flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400')}>
            +{remainingCount}
          </View>
        )}
      </View>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
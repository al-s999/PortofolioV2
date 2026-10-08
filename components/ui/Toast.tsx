import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode, useState, useEffect, createContext, useContext, useRef } from 'react';
import { View, ViewProps, Text, Pressable, Animated, Easing, StyleSheet } from 'react-native';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from './LucideIcon';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  /** Bila true, toast tidak auto-dismiss — hanya tombol close yang menutupnya. */
  persistent?: boolean;
  onClose: (id: string) => void;
  action?: { label: string; onPress: () => void };
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const colors = {
  success: 'bg-white dark:bg-gray-800 border-l-4 border-l-green-500 border-y border-r border-gray-200 dark:border-gray-700',
  error: 'bg-white dark:bg-gray-800 border-l-4 border-l-red-500 border-y border-r border-gray-200 dark:border-gray-700',
  info: 'bg-white dark:bg-gray-800 border-l-4 border-l-blue-500 border-y border-r border-gray-200 dark:border-gray-700',
  warning: 'bg-white dark:bg-gray-800 border-l-4 border-l-yellow-500 border-y border-r border-gray-200 dark:border-gray-700',
};

const iconColors = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

export const Toast = forwardRef<View, ToastProps>(
  ({ id, type, title, description, duration = 5000, persistent = false, onClose, action, ...props }, ref) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();

      if (persistent) return;

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: -100, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(() => onClose(id));
      }, duration);

      return () => clearTimeout(timer);
    }, [id, duration, persistent, onClose, fadeAnim, slideAnim]);

    const Icon = icons[type];

    return (
      <Animated.View
        ref={ref}
        style={[
          styles.toast,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
        {...props}
      >
        <View className={cn('flex-row items-start gap-3 p-4 rounded-xl border', colors[type])}>
          <View className={cn('flex-shrink-0 mt-0.5', iconColors[type])}>
            <Icon size={20} />
          </View>
          <View className="flex-1 min-w-0">
            <Text className="font-bold text-lg text-gray-900 dark:text-white">{title}</Text>
            {description && (
              <Text className="mt-1 text-base text-gray-600 dark:text-gray-300">{description}</Text>
            )}
          </View>
          {action && (
            <Pressable
              onPress={action.onPress}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-primary-600 shadow-sm self-center active:opacity-90"
            >
              <Text className="text-sm font-semibold text-white">{action.label}</Text>
            </Pressable>
          )}
          <Pressable onPress={() => onClose(id)} className="flex-shrink-0 p-1 -mt-1 -mr-1">
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </Pressable>
        </View>
      </Animated.View>
    );
  }
);

Toast.displayName = 'Toast';

const styles = StyleSheet.create({
  toast: {
    width: '100%',
    maxWidth: 400,
  },
});

interface ToastContextType {
  toasts: Array<ToastProps & { id: string }>;
  showToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id, onClose: hideToast }]);
    return id;
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <View className="absolute top-4 right-4 z-50 flex-col gap-3" pointerEvents="box-none" style={{ minWidth: 320 }}>
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
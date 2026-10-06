import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode, useEffect, useRef } from 'react';
import { View, ViewProps, Text, Pressable, Modal as RNModal, StyleSheet, Animated, Easing, Keyboard } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

const sizes = {
  sm: 'max-w-[320px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
  full: 'max-w-[90vw]',
};

export const Modal = forwardRef<View, ModalProps>(
  (
    {
      visible,
      onClose,
      children,
      title,
      description,
      size = 'md',
      closeOnOverlayClick = true,
      closeOnEscape = true,
      className,
      ...props
    },
    ref
  ) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const overlayAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      if (visible) {
        Keyboard.dismiss();
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 0, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(overlayAnim, { toValue: 0.5, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(slideAnim, { toValue: 50, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(overlayAnim, { toValue: 0, duration: 150, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(() => {});
      }
    }, [visible, fadeAnim, slideAnim, overlayAnim]);

    const handleOverlayPress = () => {
      if (closeOnOverlayClick) onClose();
      return true;
    };

    const handleKeyDown = (event: any) => {
      if (event.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    useEffect(() => {
      if (visible) {
        const subscription = Keyboard.addListener('keyboardDidShow', () => {});
        return () => subscription.remove();
      }
    }, [visible]);

    if (!visible) return null;

    return (
      <RNModal
        visible={true}
        transparent
        animationType="none"
        onRequestClose={onClose}
        {...props}
      >
        <View style={styles.wrapper}>
          <Animated.View
            style={[
              styles.overlay,
              { opacity: overlayAnim },
            ]}
            onStartShouldSetResponder={handleOverlayPress}
            onResponderRelease={handleOverlayPress}
          />
          <Animated.View
            style={[
              styles.container,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View
              className={cn(
                'w-full bg-white dark:bg-black rounded-2xl shadow-2xl',
              sizes[size],
              className
            )}
          >
            {(title || description) && (
              <View className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                {title && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                      {title}
                    </Text>
                    <Pressable onPress={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <MaterialCommunityIcons name="close" size={24} color="#6b7280" />
                    </Pressable>
                  </View>
                )}
                {description && (
                  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                  </Text>
                )}
              </View>
            )}
            <View className="p-6">{children}</View>
          </View>
          </Animated.View>
        </View>
      </RNModal>
    );
  }
);

Modal.displayName = 'Modal';

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'black',
  },
  container: {
    width: '100%',
    maxHeight: '90%',
    alignItems: 'center',
  },
});
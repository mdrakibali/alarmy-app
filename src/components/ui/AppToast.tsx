import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppInsets } from '@/utils/safeArea';

export interface ToastOptions {
  title: string;
  message?: string;
  icon?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useAppInsets();
  const [toast, setToast] = useState<ToastOptions | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-60)).current;
  const timerRef = useRef<any>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -60,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToast(null);
    });
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback(
    (options: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setToast(options);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration || 3500;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [fadeAnim, slideAnim, hideToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Animated.View
          pointerEvents="box-none"
          style={{
            top: insets.top + 8,
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="absolute left-4 right-4 z-50"
        >
          <Pressable
            onPress={hideToast}
            className="bg-white rounded-2xl py-3 px-4 flex-row items-center justify-between border border-slate-200 shadow-2xl"
          >
            <View className="flex-row items-center flex-1 pr-3">
              <Text className="text-xl mr-3">
                {toast.icon || (toast.type === 'error' ? '⚠️' : '✨')}
              </Text>
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-slate-900 tracking-tight">
                  {toast.title}
                </Text>
                {Boolean(toast.message) && (
                  <Text
                    className="text-xs font-medium text-slate-600 mt-0.5 leading-4"
                    numberOfLines={2}
                  >
                    {toast.message}
                  </Text>
                )}
              </View>
            </View>
            <Text className="text-sm text-slate-400 font-bold p-1">✕</Text>
          </Pressable>
        </Animated.View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

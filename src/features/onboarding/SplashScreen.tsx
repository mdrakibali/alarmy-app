import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { storage } from '@/storage/mmkv';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const insets = useAppInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Transition after 1.4s
    const timer = setTimeout(() => {
      const hasCompleted = storage.getBoolean('hasCompletedWelcome');
      if (hasCompleted) {
        navigation.replace('Tabs');
      } else {
        navigation.replace('WelcomeWizard');
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View className="flex-1 bg-white items-center justify-center relative">
      <StatusBar barStyle="dark-content" />

      {/* Center Branding Block */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
        className="items-center justify-center"
      >
        {/* Circular Logo Badge - Logo fits 100% inside with clean padding */}
        <View className="w-48 h-48 rounded-full bg-slate-50 border border-slate-100 items-center justify-center shadow-md mb-6 relative overflow-hidden">
          <View className="absolute inset-2 rounded-full bg-indigo-50/70" />
          <Image
            source={require('@/assets/images/logo.png')}
            className="w-32 h-32"
            resizeMode="contain"
          />
        </View>

        {/* App Title */}
        <Text className="text-4xl font-black text-[#1A2E22] tracking-tight mb-1.5">
          Alba
        </Text>

        {/* Tagline Badge */}
        <View className="bg-[#EBF3ED] px-3.5 py-1 rounded-full border border-[#6B8F71]/30 mb-2.5">
          <Text className="text-xs font-extrabold text-[#4E7D5B]">
            Smart Wake-Up & Sleep ☀️
          </Text>
        </View>

        <Text className="text-xs font-semibold text-[#5E7166] tracking-wide">
          Unbeatable Morning Alarms • Gentle Routines
        </Text>
      </Animated.View>

      {/* Bottom Footer */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        className="absolute bottom-0 items-center w-full"
      >
        <Text className="text-xs font-semibold text-slate-400">
          Version 1.0.0 • Light Edition
        </Text>
      </View>
    </View>
  );
}

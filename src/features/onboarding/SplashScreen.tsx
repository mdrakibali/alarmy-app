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
import { NativeAlarm } from '@/native/AlarmModule';
import { storage } from '@/storage/mmkv';
import { useAppInsets } from '@/utils/safeArea';
import { AppBackground } from '@/components/ui/AppBackground';

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

    let isCancelled = false;

    // Check if an alarm is already ringing on launch
    NativeAlarm.getCurrentlyRingingAlarm().then(ringing => {
      if (isCancelled) return;
      if (ringing && ringing.id) {
        // Direct jump to ringing alarm! Do not replace with Tabs or WelcomeWizard
        navigation.replace('AlarmRinging', { id: ringing.id });
        return;
      }

      // If no alarm is ringing, transition normally after 1.2s
      const timer = setTimeout(async () => {
        if (isCancelled) return;
        const stillRinging = await NativeAlarm.getCurrentlyRingingAlarm();
        if (stillRinging) {
          // If an alarm triggered during splash animation, do not go to Tabs!
          navigation.replace('AlarmRinging', { id: stillRinging.id });
          return;
        }

        const hasCompleted = storage.getBoolean('hasCompletedWelcome');
        if (hasCompleted) {
          navigation.replace('Tabs');
        } else {
          navigation.replace('WelcomeWizard');
        }
      }, 1200);

      return () => clearTimeout(timer);
    });

    return () => {
      isCancelled = true;
    };
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <AppBackground target="alarm">
      <View className="flex-1 items-center justify-center relative bg-black/20">
        <StatusBar barStyle="light-content" />

        {/* Center Branding Block */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center justify-center p-6 rounded-3xl bg-white/90 border border-white/40 shadow-2xl backdrop-blur-md"
        >
          {/* Circular Logo Badge */}
          <View className="w-40 h-40 rounded-full bg-slate-50 border border-slate-100 items-center justify-center shadow-md mb-5 relative overflow-hidden">
            <View className="absolute inset-2 rounded-full bg-emerald-50/70" />
            <Image
              source={require('@/assets/images/logo.png')}
              className="w-28 h-28"
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

          <Text className="text-xs font-semibold text-[#5E7166] tracking-wide text-center">
            Unbeatable Morning Alarms • Gentle Routines
          </Text>
        </Animated.View>

        {/* Bottom Footer */}
        <View
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
          className="absolute bottom-0 items-center w-full"
        >
          <View className="px-3 py-1 rounded-full bg-black/40">
            <Text className="text-[11px] font-semibold text-white/90">
              Version 1.0.0 • Light Edition
            </Text>
          </View>
        </View>
      </View>
    </AppBackground>
  );
}

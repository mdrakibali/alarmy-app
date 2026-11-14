import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { WALLPAPERS } from '@/data/wallpapers';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'SnoozeCountdown'>;

export function SnoozeCountdownScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const { alarmId, intervalMin, wallpaper } = route.params;

  const alarmFromStore = useAlarmStore(s =>
    s.alarms.find(a => a.id === alarmId),
  );
  const clearSnooze = useAlarmStore(s => s.clearSnooze);

  const totalSeconds = (intervalMin || 5) * 60;
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);

  // Stop any audio when snooze starts
  useEffect(() => {
    NativeAlarm.stopAlarm();
    NativeAlarm.stopSoundPreview();
  }, []);

  // Prevent hardware back press
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  // Live second countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // 5 minutes are up! Start alarm sound and ring again!
          NativeAlarm.startAlarm(alarmId).catch(() => {});
          navigation.replace('AlarmRinging', { id: alarmId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [alarmId, navigation]);

  const handleSolveMissionNow = () => {
    clearSnooze(alarmId);
    NativeAlarm.startAlarm(alarmId).catch(() => {});
    navigation.replace('AlarmRinging', { id: alarmId });
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(
    seconds,
  ).padStart(2, '0')}`;

  const activeWallpaperId =
    wallpaper || alarmFromStore?.wallpaper || 'kpop_wonhee';
  const activeBg =
    WALLPAPERS.find(w => w.id === activeWallpaperId) ||
    BACKGROUND_ITEMS.find(b => b.id === activeWallpaperId) ||
    WALLPAPERS[0];

  return (
    <View className="flex-1 relative bg-slate-900">
      {/* Edge-to-Edge Animated Wallpaper */}
      <Image
        source={activeBg.source}
        className="absolute inset-0 w-full h-full opacity-80"
        resizeMode="cover"
      />
      <View className="absolute inset-0 bg-black/45" pointerEvents="none" />

      {/* Screen Foreground Content */}
      <View
        className="flex-1 justify-between px-6"
        style={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom + 12, 32),
        }}
      >
        {/* Top Snooze Status Banner */}
        <View className="items-center mt-2">
          <View className="bg-black/50 border border-white/20 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-white text-xs font-black tracking-widest uppercase">
              SNOOZE ACTIVE 💤
            </Text>
          </View>
          <Text className="text-white/80 text-sm font-semibold text-center">
            Resting peacefully. Sound is silent.
          </Text>
        </View>

        {/* Center Ambient Countdown Display */}
        <View className="items-center justify-center my-6">
          <View className="h-72 w-72 rounded-full bg-white/15 border-4 border-white/30 items-center justify-center p-6 shadow-2xl backdrop-blur-md">
            <Text className="text-6xl font-black text-white tracking-tight">
              {formattedCountdown}
            </Text>
            <Text className="text-xs font-black tracking-widest uppercase text-amber-300 mt-2">
              REMAINING
            </Text>
            <Text className="text-xs text-white/70 mt-1 font-medium">
              Alarm will re-ring at 00:00
            </Text>
          </View>
        </View>

        {/* Bottom Actions */}
        <View className="w-full">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSolveMissionNow}
            className="w-full bg-[#4E7D5B] py-4 rounded-2xl items-center shadow-lg active:bg-[#3D6347] mb-3"
          >
            <Text className="text-white text-base font-black tracking-wide">
              I'm Awake - Solve Mission ☀️
            </Text>
          </TouchableOpacity>

          <View className="w-full py-2.5 px-3 rounded-2xl bg-black/40 border border-white/10 items-center">
            <Text className="text-white/60 text-xs font-semibold text-center">
              🔒 Unbeatable Wake-Up: Alarm cannot be turned off without solving your mission!
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}


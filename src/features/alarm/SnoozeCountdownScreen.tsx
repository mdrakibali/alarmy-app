import React, { useEffect, useState } from 'react';
import { BackHandler, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'SnoozeCountdown'>;

export function SnoozeCountdownScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const { alarmId, intervalMin, wallpaper } = route.params;
  const alarmFromStore = useAlarmStore(s => s.alarms.find(a => a.id === alarmId));
  const clearSnooze = useAlarmStore(s => s.clearSnooze);
  const themeAlarm = useThemeStore(s => s.alarmBackground);
  const wallpaperId = wallpaper || alarmFromStore?.wallpaper || themeAlarm;

  const [secondsLeft, setSecondsLeft] = useState((intervalMin || 5) * 60);
  const [snoozesLeft, setSnoozesLeft] = useState<number | null>(null);

  useEffect(() => {
    try {
      Promise.resolve(NativeAlarm.stopAlarm()).catch(() => {});
      Promise.resolve(NativeAlarm.stopSoundPreview()).catch(() => {});
    } catch {}
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    let live = true;
    NativeAlarm.listAlarms().then(rows => {
      if (!live) return;
      const row = rows.find(item => item.id === alarmId);
      if (!row) return;
      const remaining = Math.max(0, row.snoozeMaxCount - row.snoozeUsed);
      setSnoozesLeft(remaining);
      const leftMs = row.triggerTimeMs - Date.now();
      if (leftMs > 1000) setSecondsLeft(Math.ceil(leftMs / 1000));
    });
    return () => {
      live = false;
    };
  }, [alarmId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
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
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const maxCount = alarmFromStore?.snooze.maxCount;

  return (
    <AppBackground target="ringing" backgroundId={wallpaperId}>
      <View
        className="flex-1 justify-between px-6"
        style={{
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom + 12, 32),
        }}
      >
        <View className="items-center mt-2">
          <View className="bg-black/50 border border-white/20 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-white text-xs font-black tracking-widest uppercase">Snooze</Text>
          </View>
          <Text className="text-white text-sm font-semibold text-center">
            {snoozesLeft == null
              ? 'Counting down on your wallpaper'
              : snoozesLeft === 0
                ? 'No snoozes left after this one'
                : `${snoozesLeft} snooze${snoozesLeft === 1 ? '' : 's'} left`}
            {maxCount != null && snoozesLeft != null ? ` of ${maxCount}` : ''}
          </Text>
        </View>

        <View className="items-center justify-center">
          <View className="h-56 w-56 rounded-full bg-black/35 border-4 border-white/70 items-center justify-center">
            <Text className="text-6xl font-black text-white tracking-tight">{formattedCountdown}</Text>
            <Text className="text-xs font-black tracking-widest uppercase text-white mt-2">Until it rings</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSolveMissionNow}
          className="w-full bg-[#1652E6] py-4 rounded-2xl items-center active:bg-[#0B45C4]"
        >
          <Text className="text-white text-base font-black">I'm awake. Start mission</Text>
        </TouchableOpacity>
      </View>
    </AppBackground>
  );
}

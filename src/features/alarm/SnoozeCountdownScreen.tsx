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
    if (secondsLeft <= 0) {
      NativeAlarm.startAlarm(alarmId).catch(() => {});
      navigation.replace('AlarmRinging', { id: alarmId });
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [alarmId, navigation, secondsLeft]);

  const hasMissions = Boolean(alarmFromStore?.missions && alarmFromStore.missions.length > 0);

  const handleSolveMissionNow = () => {
    clearSnooze(alarmId);
    NativeAlarm.startAlarm(alarmId).catch(() => {});
    navigation.replace('AlarmRinging', { id: alarmId });
  };

  const handleDirectDismiss = async () => {
    try {
      await NativeAlarm.dismissSnooze(alarmId);
    } catch {}
    useAlarmStore.getState().dismissSnooze(alarmId);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
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
        {/* Top Header */}
        <View className="items-center mt-6 w-full">
          <View className="bg-black/50 border border-white/20 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-white text-xs font-black tracking-widest uppercase">SNOOZE 😴</Text>
          </View>
        </View>

        {/* Center Countdown & Remaining Snooze Badge */}
        <View className="items-center justify-center">
          <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mb-3">
            <Text className="text-2xl">⏰</Text>
          </View>
          <Text
            style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 10 }}
            className="text-7xl font-black text-white tracking-tight"
          >
            {formattedCountdown}
          </Text>
          <Text
            style={{ textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 }}
            className="text-base font-extrabold text-white/90 mt-2 text-center"
          >
            {snoozesLeft == null
              ? 'Snooze active'
              : snoozesLeft === 0
                ? 'No snoozes left (Final countdown)'
                : `Snooze ${snoozesLeft} time${snoozesLeft === 1 ? '' : 's'} left`}
            {maxCount != null && snoozesLeft != null && snoozesLeft > 0 ? ` (of ${maxCount})` : ''}
          </Text>
        </View>

        {/* Bottom Action: Start Mission or Direct Dismiss */}
        <View className="w-full">
          {hasMissions ? (
            <>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSolveMissionNow}
                className="w-full bg-[#FF2D55] py-4 rounded-3xl items-center shadow-2xl active:bg-[#E0264A]"
              >
                <Text className="text-white text-lg font-black tracking-wider">Start Mission</Text>
              </TouchableOpacity>
              <Text className="text-white/70 text-xs font-semibold text-center mt-2.5">
                Complete mission to dismiss alarm & cancel remaining snoozes ✓
              </Text>
            </>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDirectDismiss}
              className="w-full bg-emerald-600 py-4 rounded-3xl items-center shadow-2xl active:bg-emerald-700"
            >
              <Text className="text-white text-lg font-black tracking-wider">I'm Awake • Turn Off Alarm</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AppBackground>
  );
}

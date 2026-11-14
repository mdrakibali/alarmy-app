import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { NativeAlarm, type RingingAlarmInfo } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAppInsets } from '@/utils/safeArea';
import { useAlarmStore } from './alarmStore';
import { formatTime } from './format';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmRinging'>;

export function AlarmRingingScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const alarmId = route.params?.id;
  const alarmFromStore = useAlarmStore(s =>
    alarmId ? s.alarms.find(a => a.id === alarmId) : undefined,
  );

  const [activeInfo, setActiveInfo] = useState<RingingAlarmInfo | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Clock ticker every second
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Prevent hardware back button from closing the ringing alarm
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    NativeAlarm.getCurrentlyRingingAlarm().then(info => {
      if (info) {
        setActiveInfo(info);
      }
    });
  }, []);

  const label = alarmFromStore?.label || activeInfo?.label || 'Wake up early';
  const missions = alarmFromStore?.missions || activeInfo?.missions || [];
  const snoozeEnabled =
    alarmFromStore?.snooze.enabled ?? activeInfo?.snoozeEnabled ?? true;
  const snoozeInterval =
    alarmFromStore?.snooze.intervalMin ?? activeInfo?.snoozeIntervalMin ?? 5;

  const { time, period } = formatTime(
    currentTime.getHours(),
    currentTime.getMinutes(),
  );

  const snoozeAlarmInStore = useAlarmStore(s => s.snoozeAlarm);

  const handleSnooze = async () => {
    const id = alarmId || activeInfo?.id;
    if (id) {
      snoozeAlarmInStore(id, snoozeInterval);
      await NativeAlarm.snoozeAlarm(id, snoozeInterval);
      navigation.replace('SnoozeCountdown', {
        alarmId: id,
        intervalMin: snoozeInterval,
        wallpaper: alarmFromStore?.wallpaper,
      });
    } else {
      await NativeAlarm.stopAlarm();
      navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
    }
  };

  const handleDismissOrMission = async () => {
    const id = alarmId || activeInfo?.id;
    if (missions.length > 0) {
      const firstMission = missions[0];
      if (firstMission === 'math') {
        navigation.navigate('MathMission', { alarmId: id, missionIndex: 0, missions });
        return;
      }
      if (firstMission === 'shake') {
        navigation.navigate('ShakeMission', { alarmId: id, missionIndex: 0, missions });
        return;
      }
      if (firstMission === 'qr') {
        navigation.navigate('BarcodeMission', { alarmId: id, missionIndex: 0, missions });
        return;
      }
    }

    // No mission: direct dismiss
    await NativeAlarm.stopAlarm();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const hasMission = missions.length > 0;
  const missionButtonText = missions.includes('math')
    ? 'Solve Math to Dismiss 🧠'
    : missions.includes('shake')
    ? 'Shake Phone to Dismiss 📱'
    : missions.includes('qr')
    ? 'Scan Barcode to Dismiss 📷'
    : 'Complete Mission to Dismiss 🎯';

  return (
    <AppBackground target="ringing" backgroundId={alarmFromStore?.wallpaper}>
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        className="flex-1 items-center justify-between px-6"
      >
        {/* Top section: Alarm Label & Status */}
        <View className="items-center mt-6">
          <View className="bg-rose-50 border border-rose-200/60 px-4 py-1.5 rounded-full mb-3">
            <Text className="text-[#FF385C] font-extrabold tracking-wider uppercase text-xs">
              ALARM RINGING ⏰
            </Text>
          </View>
          <Text className="text-3xl font-black text-slate-900 text-center">
            {label}
          </Text>
        </View>

        {/* Middle section: Big circular clock */}
        <View className="items-center justify-center my-8">
          <View className="h-68 w-68 rounded-full border-4 border-white items-center justify-center bg-white shadow-2xl">
            <Text className="text-6xl font-black text-slate-900 tracking-tight">
              {time}
            </Text>
            <Text className="text-xl font-bold text-[#FF385C] mt-1">
              {period}
            </Text>
          </View>
        </View>

        {/* Bottom section: Actions */}
        <View className="w-full">
          {/* Main Action (Dismiss or Mission) */}
          <Pressable
            onPress={handleDismissOrMission}
            className="w-full bg-[#FF385C] py-5 rounded-2xl items-center active:opacity-90 shadow-md mb-3"
          >
            <Text className="text-white text-lg font-black tracking-wide">
              {hasMission ? missionButtonText : 'Dismiss Alarm'}
            </Text>
          </Pressable>

          {/* Snooze Button */}
          {snoozeEnabled && (
            <Pressable
              onPress={handleSnooze}
              className="w-full bg-white border border-slate-200 py-4 rounded-2xl items-center active:bg-slate-50"
            >
              <Text className="text-slate-700 text-base font-bold">
                Snooze ({snoozeInterval} min)
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </AppBackground>
  );
}

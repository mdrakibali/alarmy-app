import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeAlarm, type RingingAlarmInfo } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import { formatTime } from './format';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmRinging'>;

export function AlarmRingingScreen({ navigation, route }: Props) {
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

  const label = alarmFromStore?.label || activeInfo?.label || 'Wake up!';
  const missions = alarmFromStore?.missions || activeInfo?.missions || [];
  const snoozeEnabled =
    alarmFromStore?.snooze.enabled ?? activeInfo?.snoozeEnabled ?? true;
  const snoozeInterval =
    alarmFromStore?.snooze.intervalMin ?? activeInfo?.snoozeIntervalMin ?? 5;

  const { time, period } = formatTime(
    currentTime.getHours(),
    currentTime.getMinutes(),
  );

  const handleSnooze = async () => {
    const id = alarmId || activeInfo?.id;
    if (id) {
      await NativeAlarm.snoozeAlarm(id, snoozeInterval);
    } else {
      await NativeAlarm.stopAlarm();
    }
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const handleDismissOrMission = async () => {
    if (missions.includes('math')) {
      navigation.navigate('MathMission', { alarmId: alarmId || activeInfo?.id });
      return;
    }
    if (missions.includes('shake')) {
      navigation.navigate('ShakeMission', { alarmId: alarmId || activeInfo?.id });
      return;
    }

    // No mission or other mission: direct dismiss
    await NativeAlarm.stopAlarm();
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const hasMission = missions.length > 0;
  const missionButtonText = missions.includes('math')
    ? 'Solve Math to Dismiss 🧠'
    : missions.includes('shake')
    ? 'Shake Phone to Dismiss 📱'
    : 'Complete Mission to Dismiss 🎯';

  return (
    <View className="flex-1 bg-slate-950 items-center justify-between px-6 py-16">
      {/* Top section: Alarm Label & Status */}
      <View className="items-center mt-6">
        <View className="bg-amber-500/20 px-4 py-1.5 rounded-full mb-3">
          <Text className="text-amber-400 font-semibold tracking-wider uppercase text-xs">
            Alarm Ringing
          </Text>
        </View>
        <Text className="text-3xl font-bold text-white text-center">
          {label}
        </Text>
      </View>

      {/* Middle section: Big pulsing clock */}
      <View className="items-center justify-center my-8">
        <View className="h-64 w-64 rounded-full border-2 border-amber-500/30 items-center justify-center bg-slate-900/60 shadow-2xl">
          <Text className="text-6xl font-bold text-white tracking-tight">
            {time}
          </Text>
          <Text className="text-xl font-semibold text-amber-400 mt-1">
            {period}
          </Text>
        </View>
      </View>

      {/* Bottom section: Actions */}
      <View className="w-full space-y-4">
        {/* Main Action (Dismiss or Mission) */}
        <Pressable
          onPress={handleDismissOrMission}
          className="w-full bg-amber-500 py-5 rounded-2xl items-center active:opacity-90 shadow-lg"
        >
          <Text className="text-slate-950 text-xl font-bold">
            {hasMission ? missionButtonText : 'Dismiss Alarm'}
          </Text>
        </Pressable>

        {/* Snooze Button */}
        {snoozeEnabled && (
          <Pressable
            onPress={handleSnooze}
            className="w-full bg-slate-800 py-4 rounded-2xl items-center active:bg-slate-700 mt-3"
          >
            <Text className="text-slate-200 text-base font-semibold">
              Snooze ({snoozeInterval} min)
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}


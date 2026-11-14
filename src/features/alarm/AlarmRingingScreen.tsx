import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { NativeAlarm, type RingingAlarmInfo } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
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
      } else if (alarmId) {
        // If service is not actively ringing (e.g. after snooze countdown), trigger it!
        NativeAlarm.startAlarm(alarmId).catch(() => {});
      }
    });
  }, [alarmId]);

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
      if (firstMission === 'step') {
        navigation.navigate('StepMission', {
          alarmId: id,
          missionIndex: 0,
          missions,
          stepTarget: alarmFromStore?.stepTarget ?? 20,
        });
        return;
      }
      if (firstMission === 'photo') {
        navigation.navigate('PhotoMission', {
          alarmId: id,
          missionIndex: 0,
          missions,
          referencePath: alarmFromStore?.photoReferencePath,
          matchThreshold: alarmFromStore?.photoMatchThreshold ?? 72,
        });
        return;
      }
      if (firstMission === 'qr') {
        navigation.navigate('BarcodeMission', {
          alarmId: id,
          missionIndex: 0,
          missions,
          registeredCode: alarmFromStore?.barcodeValue,
        });
        return;
      }
      if (firstMission === 'squat') {
        navigation.navigate('SquatMission', {
          alarmId: id,
          missionIndex: 0,
          missions,
          squatTarget: alarmFromStore?.squatTarget ?? 10,
        });
        return;
      }
      if (firstMission === 'typing') {
        navigation.navigate('TypingMission', { alarmId: id, missionIndex: 0, missions });
        return;
      }
      if (firstMission === 'memory') {
        navigation.navigate('MemoryMission', { alarmId: id, missionIndex: 0, missions });
        return;
      }
    }

    // No mission: direct dismiss
    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: label || 'Morning Alarm',
      scheduledTime: `${time} ${period}`,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: [],
      snoozeCount: 0,
    });
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
    : missions.includes('photo')
    ? 'Take Photo to Dismiss 📸'
    : missions.includes('squat')
    ? 'Perform Squats to Dismiss 🏋️'
    : missions.includes('typing')
    ? 'Type Affirmation to Dismiss ⌨️'
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
          <View className="bg-[#EBF3ED] border border-[#6B8F71]/30 px-4 py-1.5 rounded-full mb-3">
            <Text className="text-[#4E7D5B] font-extrabold tracking-wider uppercase text-xs">
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
            <Text className="text-xl font-bold text-[#4E7D5B] mt-1">
              {period}
            </Text>
          </View>
        </View>

        {/* Bottom section: Actions */}
        <View className="w-full">
          {/* Main Action (Dismiss or Mission) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismissOrMission}
            className="w-full bg-[#4E7D5B] py-5 rounded-2xl items-center shadow-md mb-3"
          >
            <Text className="text-white text-lg font-black tracking-wide">
              {hasMission ? missionButtonText : 'Dismiss Alarm'}
            </Text>
          </TouchableOpacity>

          {/* Snooze Button */}
          {snoozeEnabled && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSnooze}
              className="w-full bg-white border border-slate-200 py-4 rounded-2xl items-center shadow-xs"
            >
              <Text className="text-slate-700 text-base font-bold">
                Snooze ({snoozeInterval} min)
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AppBackground>
  );
}

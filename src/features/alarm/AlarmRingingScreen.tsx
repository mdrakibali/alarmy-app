import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
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
import { useThemeStore } from '@/storage/themeStore';
import { useAlarmStore } from './alarmStore';
import { formatAlarmyClock, formatAlarmyDate, formatTime } from './format';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmRinging'>;

export function AlarmRingingScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const alarmId = route.params?.id;
  const alarmFromStore = useAlarmStore(s =>
    alarmId ? s.alarms.find(a => a.id === alarmId) : undefined,
  );
  const themeAlarm = useThemeStore(s => s.alarmBackground);
  const themeRinging = useThemeStore(s => s.ringingBackground);
  const wallpaperId = alarmFromStore?.wallpaper || themeAlarm || themeRinging;

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
      const ok = await NativeAlarm.snoozeAlarm(id, snoozeInterval);
      if (!ok) return;
      snoozeAlarmInStore(id, snoozeInterval);
      navigation.replace('SnoozeCountdown', {
        alarmId: id,
        intervalMin: snoozeInterval,
        wallpaper: wallpaperId,
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
  const snoozeMaxCount = alarmFromStore?.snooze.maxCount ?? 3;
  const formattedDate = formatAlarmyDate(currentTime);
  const formattedClock = formatAlarmyClock(currentTime);

  const displayLabel = label || 'Wake up early';
  const hasEmoji = /\p{Extended_Pictographic}/u.test(displayLabel);
  const labelWithEmoji = hasEmoji ? displayLabel : `🐥 ${displayLabel}`;

  return (
    <AppBackground target="ringing" backgroundId={wallpaperId}>
      <View
        style={{
          paddingTop: Math.max(insets.top, 24) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        }}
        className="flex-1 justify-between px-6"
      >
        {/* Top Header: Date, Huge Alarmy Clock, and Emoji Label Pill (Image 2 format) */}
        <View className="items-center mt-2">
          {/* Top Date */}
          <Text
            style={styles.dateShadow}
            className="text-white text-base font-bold tracking-wide text-center"
          >
            {formattedDate}
          </Text>

          {/* Huge Alarmy Clock */}
          <Text
            style={styles.clockShadow}
            className="text-white text-[94px] font-black tracking-tight text-center leading-none mt-1 mb-2"
          >
            {formattedClock}
          </Text>

          {/* Dark Label Badge Pill */}
          <View className="bg-black/60 px-4 py-1.5 rounded-full flex-row items-center border border-white/10 shadow-md">
            <Text className="text-white font-extrabold text-sm tracking-wide">
              {labelWithEmoji}
            </Text>
          </View>
        </View>

        {/* Center Wallpaper View (Clean, immersive) */}
        <View className="flex-1" />

        {/* Bottom Section: Floating Snooze Pill & Coral Action Button */}
        <View className="w-full items-center">
          {/* Snooze Button: ❸ Snooze floating white pill */}
          {snoozeEnabled && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSnooze}
              className="bg-white px-7 py-2.5 rounded-full flex-row items-center justify-center shadow-2xl mb-4"
            >
              <View className="w-5 h-5 rounded-full bg-black items-center justify-center mr-2">
                <Text className="text-white text-[11px] font-black">
                  {snoozeMaxCount}
                </Text>
              </View>
              <Text className="text-slate-900 font-black text-base tracking-wide">
                Snooze
              </Text>
            </TouchableOpacity>
          )}

          {/* Primary Action Button: Alarmy signature Coral Red (#FF2D55) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismissOrMission}
            className="w-full bg-[#FF2D55] py-4.5 rounded-3xl items-center justify-center shadow-2xl"
          >
            <Text className="text-white text-xl font-black tracking-wider">
              {hasMission ? 'Start Mission' : 'Dismiss'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  dateShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  clockShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});

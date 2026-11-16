import { AppBackground } from '@/components/ui/AppBackground';
import { navigateToMission } from '@/features/missions/missionNavigation';
import { NativeAlarm, type RingingAlarmInfo } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useActiveMissionStore } from '@/storage/activeMissionStore';
import { useReportStore } from '@/storage/reportStore';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAlarmStore } from './alarmStore';
import { formatAlbaClock, formatAlbaDate, formatTime } from './format';

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

  const currentAlarmId = alarmId || activeInfo?.id;
  const session = useActiveMissionStore(s => s.session);
  const activeSession = useMemo(() => {
    if (!session) return null;
    if (currentAlarmId && session.alarmId !== currentAlarmId) return null;
    if (session.activeMissionIndex >= session.missions.length) return null;
    const currentKey = session.missions[session.activeMissionIndex] ?? null;
    return {
      isInProgress: true,
      alarmId: session.alarmId,
      currentIndex: session.activeMissionIndex,
      currentMissionKey: currentKey,
      completedMissions: session.completedMissions,
      totalCount: session.missions.length,
      missions: session.missions,
      subProgress: session.currentSubProgress ?? 0,
    };
  }, [currentAlarmId, session]);
  const isInProgress = Boolean(
    activeSession &&
      activeSession.isInProgress &&
      activeSession.currentIndex < missions.length,
  );
  const activeMissionIndex = activeSession?.currentIndex ?? 0;
  const currentMissionKey = missions[activeMissionIndex] || missions[0];

  const handleSnooze = async () => {
    const id = currentAlarmId;
    useActiveMissionStore.getState().clearSession();
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
    const id = currentAlarmId;
    if (missions.length > 0) {
      if (!activeSession) {
        useActiveMissionStore
          .getState()
          .startSession(id || 'default', missions, 0);
      }
      const targetIndex = activeSession ? activeSession.currentIndex : 0;
      const targetMissionKey = missions[targetIndex] || missions[0];

      navigateToMission(
        navigation,
        targetMissionKey,
        {
          alarmId: id,
          missionIndex: targetIndex,
          missions,
          stepTarget: alarmFromStore?.stepTarget ?? 5,
          squatTarget: alarmFromStore?.squatTarget ?? 3,
          shakeTarget: alarmFromStore?.shakeTarget ?? 5,
          flipTarget: alarmFromStore?.flipTarget ?? 5,
          blinkTarget: alarmFromStore?.blinkTarget ?? 5,
          referencePath: alarmFromStore?.photoReferencePath,
          matchThreshold: alarmFromStore?.photoMatchThreshold ?? 72,
          registeredCode: alarmFromStore?.barcodeValue,
        },
        'navigate',
      );
      return;
    }

    // No mission: direct dismiss
    useActiveMissionStore.getState().clearSession();
    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(
      now.getMinutes(),
    ).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
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
  const snoozeUsed = activeInfo?.snoozeUsed ?? 0;
  const snoozeMaxCount =
    alarmFromStore?.snooze.maxCount ?? activeInfo?.snoozeMaxCount ?? 3;
  const remainingSnoozes = Math.max(0, snoozeMaxCount - snoozeUsed);
  const canSnooze = snoozeEnabled && remainingSnoozes > 0;

  const formattedDate = formatAlbaDate(currentTime);
  const formattedClock = formatAlbaClock(currentTime);

  const displayLabel = label || 'Wake up early';
  const hasEmoji = /\p{Extended_Pictographic}/u.test(displayLabel);
  const labelWithEmoji = hasEmoji ? displayLabel : `🐥 ${displayLabel}`;

  return (
    <AppBackground
      target="ringing"
      backgroundId={wallpaperId}
      videoMuted={!(alarmFromStore?.useVideoAudio ?? activeInfo?.useVideoAudio ?? false)}
    >
      <View
        style={{
          paddingTop: Math.max(insets.top, 24) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        }}
        className="flex-1 justify-between px-6"
      >
        {/* Top Header: Date, Huge Alba Clock, and Emoji Label Pill (Image 2 format) */}
        <View className="items-center mt-2">
          {/* Top Date */}
          <Text
            style={styles.dateShadow}
            className="text-white text-base font-bold tracking-wide text-center"
          >
            {formattedDate}
          </Text>

          {/* Huge Alba Clock with AM/PM */}
          <View className="flex-row items-baseline justify-center mt-1 mb-2">
            <Text
              style={styles.clockShadow}
              className="text-white text-[94px] font-black tracking-tight text-center leading-none"
            >
              {formattedClock}
            </Text>
            <Text className="text-white/80 font-black text-xl ml-2 uppercase tracking-widest">
              {currentTime.getHours() >= 12 ? 'PM' : 'AM'}
            </Text>
          </View>

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
          {isInProgress && (
            <View className="bg-emerald-500/90 border border-white/20 px-4 py-1.5 rounded-full mb-3 shadow-md flex-row items-center">
              <Text className="text-white text-xs font-black uppercase tracking-wider">
                ⚡ Resuming: {activeMissionIndex} of {missions.length} Finished
              </Text>
            </View>
          )}

          {/* Snooze Button: Floating white pill with remaining count */}
          {canSnooze ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSnooze}
              className="bg-white px-7 py-2.5 rounded-full flex-row items-center justify-center shadow-2xl mb-4"
            >
              <View className="w-5 h-5 rounded-full bg-black items-center justify-center mr-2">
                <Text className="text-white text-[11px] font-black">
                  {remainingSnoozes}
                </Text>
              </View>
              <Text className="text-slate-900 font-black text-base tracking-wide">
                Snooze
              </Text>
            </TouchableOpacity>
          ) : snoozeEnabled && remainingSnoozes === 0 ? (
            <View className="bg-black/60 px-5 py-2 rounded-full mb-4 border border-rose-400/50 shadow-md">
              <Text className="text-rose-300 font-extrabold text-xs tracking-wide text-center">
                🚫 Snooze limit exhausted ({snoozeMaxCount}/{snoozeMaxCount}) • Complete mission to dismiss
              </Text>
            </View>
          ) : null}

          {/* Primary Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDismissOrMission}
            className={`w-full ${
              isInProgress ? 'bg-primary' : 'bg-danger'
            } h-16 rounded-3xl items-center justify-center shadow-2xl`}
          >
            <Text className="text-white text-lg font-black tracking-wider text-center">
              {hasMission
                ? isInProgress
                  ? `Continue Mission (${currentMissionKey.toUpperCase()} • ${
                      activeMissionIndex + 1
                    }/${missions.length})`
                  : missions.length > 1
                  ? `Start Missions (1/${missions.length})`
                  : 'Start Mission'
                : 'Dismiss'}
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

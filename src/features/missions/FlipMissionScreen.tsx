import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Text,
  Vibration,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useActiveMissionStore } from '@/storage/activeMissionStore';
import { useAppInsets } from '@/utils/safeArea';
import { dismissAlarmOnMissionSuccess, proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'FlipMission'>;

export function FlipMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const isPreview = Boolean(route.params?.isPreview);
  const target = isPreview ? 3 : (route.params?.flipTarget ?? 5);
  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const missionsParam = route.params?.missions;
  const allMissions = useMemo(() => missionsParam ?? [], [missionsParam]);

  const savedSubProgress = useActiveMissionStore.getState().getSubProgress();
  const [flipsDone, setFlipsDone] = useState(() => Math.min(target - 1, Math.max(0, savedSubProgress)));
  const [isFaceDown, setIsFaceDown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isCompletedRef = useRef(false);

  // Disable hardware back button (only if not preview)
  useEffect(() => {
    if (isPreview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isPreview]);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    if (isPreview) {
      setShowSuccessModal(true);
      return;
    }

    useActiveMissionStore.getState().updateSubProgress(target);

    try {
      Vibration.vibrate([0, 150, 75, 150]);
    } catch {}

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { flipTarget: target },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['flip'],
      snoozeCount: 0,
    });

    await dismissAlarmOnMissionSuccess(alarmId);
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, target, isPreview]);

  // Listen to native FlipDetector events
  useEffect(() => {
    const unsub = NativeAlarm.onFlip(({ count, isFaceDown: faceDown }) => {
      setIsFaceDown(faceDown);
      try {
        Vibration.vibrate(50);
      } catch {}

      if (count > flipsDone) {
        setFlipsDone(count);
        useActiveMissionStore.getState().updateSubProgress(count);
        if (count >= target) {
          setTimeout(completeMission, 200);
        }
      }
    });

    return () => unsub();
  }, [completeMission, flipsDone, target]);

  const progressPct = Math.min(100, Math.round((flipsDone / target) * 100));

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="flex-1 justify-between px-6 items-center"
      >
        {/* Top Header */}
        <View className="items-center mt-3">
          <View className="bg-ice border border-primary/25 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-primary font-extrabold text-xs uppercase tracking-wider">
              FLIP PHONE MISSION 🔄
            </Text>
          </View>
          <Text className="text-2xl font-black text-navy text-center">
            Flip Phone {target} Times
          </Text>
          <Text className="text-xs text-subtext font-semibold mt-1 text-center">
            Turn your phone face-down and back up to stop the alarm
          </Text>
        </View>

        {/* Center 3D Flip Card Visual */}
        <View className="items-center justify-center my-6 w-full">
          {/* Circular progress container */}
          <View
            className={`h-56 w-56 rounded-full border-8 ${
              flipsDone >= target
                ? 'border-emerald-500 bg-emerald-50/90'
                : flipsDone > 0
                ? 'border-primary bg-white/95'
                : 'border-primary/20 bg-white/95'
            } items-center justify-center shadow-xl relative`}
          >
            <Text className="text-5xl font-black text-navy">
              {flipsDone}
            </Text>
            <Text className="text-xs font-bold text-subtext mt-0.5 tracking-wider uppercase">
              / {target} FLIPS
            </Text>

            {/* Current State Pill */}
            <View
              className={`mt-3 px-3.5 py-1.5 rounded-full ${
                isFaceDown ? 'bg-amber-100 border border-amber-300' : 'bg-ice border border-primary/30'
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  isFaceDown ? 'text-amber-800' : 'text-primary'
                }`}
              >
                {isFaceDown ? '🔄 Turn Face-Up Now' : '📱 Turn Face-Down Now'}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="w-64 bg-slate-200 h-2.5 rounded-full mt-6 overflow-hidden">
            <View
              style={{ width: `${progressPct}%` }}
              className="bg-primary h-full rounded-full"
            />
          </View>
        </View>

        {/* Guidance Box */}
        <View className="items-center w-full mb-4">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 shadow-xs mb-3">
            <Text className="text-xs font-bold text-navy text-center">
              💡 Physical movement and wrist coordination wake up your motor cortex and clear grogginess.
            </Text>
          </View>

          <Pressable
            onPress={() => {
              // Manual tap fallback for testing or disabled gyro
              const next = flipsDone + 1;
              setFlipsDone(next);
              useActiveMissionStore.getState().updateSubProgress(next);
              if (next >= target) setTimeout(completeMission, 200);
            }}
            className="py-2"
          >
            <Text className="text-xs font-semibold text-slate-400 text-center underline">
              Tap here if motion sensor is unavailable
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Wide Awake! ⚡"
        message={`Completed ${target} phone flips. Good morning!`}
        confirmText="Start My Day ☀️"
        icon="🔄"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
      />
    </AppBackground>
  );
}


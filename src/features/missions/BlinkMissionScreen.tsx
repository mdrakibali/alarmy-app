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

type Props = NativeStackScreenProps<RootStackParamList, 'BlinkMission'>;

export function BlinkMissionScreen({ navigation, route }: Props) {
  const target = route.params?.blinkTarget ?? 5;
  const insets = useAppInsets();
  const logAlarmDismissed = useReportStore(s => s.logAlarmDismissed);

  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const missionsParam = route.params?.missions;
  const allMissions = useMemo(() => missionsParam ?? [], [missionsParam]);

  const savedSubProgress = useActiveMissionStore.getState().getSubProgress();
  const [blinksDone, setBlinksDone] = useState(() => Math.min(target - 1, Math.max(0, savedSubProgress)));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    useActiveMissionStore.getState().updateSubProgress(target);

    try {
      Vibration.vibrate([0, 150, 75, 150]);
    } catch {}

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { blinkTarget: target },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['blink'],
      snoozeCount: 0,
    });

    await dismissAlarmOnMissionSuccess(alarmId);
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, logAlarmDismissed, target]);

  const startBlinkCamera = useCallback(async () => {
    setCameraBlocked(false);
    const result = await NativeAlarm.openCameraMission({ mode: 'blink', target });
    if (result?.completed) {
      const done = result.count ?? target;
      setBlinksDone(done);
      useActiveMissionStore.getState().updateSubProgress(done);
      completeMission();
      return;
    }
    setCameraBlocked(true);
  }, [completeMission, target]);

  const startRef = useRef(startBlinkCamera);
  startRef.current = startBlinkCamera;

  useEffect(() => {
    startRef.current();
  }, []);

  const progressPct = Math.min(100, Math.round((blinksDone / target) * 100));

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
              BLINK EYE MISSION 👁️
            </Text>
          </View>
          <Text className="text-2xl font-black text-navy text-center">
            Blink {target} Times
          </Text>
          <Text className="text-xs text-subtext font-semibold mt-1 text-center">
            Front camera will verify your eyes opening and closing
          </Text>
        </View>

        {/* Center Progress Visual */}
        <View className="items-center justify-center my-6">
          <View
            className={`h-56 w-56 rounded-full border-8 ${
              blinksDone >= target
                ? 'border-emerald-500 bg-emerald-50/90'
                : blinksDone > 0
                ? 'border-primary bg-white/95'
                : 'border-primary/20 bg-white/95'
            } items-center justify-center shadow-xl relative`}
          >
            <Text className="text-5xl font-black text-navy">
              {blinksDone}
            </Text>
            <Text className="text-xs font-bold text-subtext mt-0.5 tracking-wider uppercase">
              / {target} BLINKS
            </Text>
            <View
              className={`mt-3 px-3 py-1 rounded-full ${
                blinksDone >= target ? 'bg-emerald-100' : 'bg-ice'
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  blinksDone >= target ? 'text-emerald-700' : 'text-primary'
                }`}
              >
                {blinksDone >= target ? 'VERIFIED ✓' : `${progressPct}% Done`}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Guide */}
        <View className="items-center w-full mb-4">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 shadow-xs mb-3">
            <Text className="text-xs font-bold text-navy text-center">
              💡 ML Kit AI face detection ensures your eyes are genuinely open and alert before stopping the alarm.
            </Text>
          </View>

          <Pressable
            onPress={startBlinkCamera}
            className="w-full bg-primary py-4 rounded-2xl items-center shadow-md mb-2 active:bg-primary-dark"
          >
            <Text className="text-white text-base font-black tracking-wide">
              {cameraBlocked ? '📷 Open Front Camera Again' : 'Camera is Opening...'}
            </Text>
          </Pressable>

          {cameraBlocked && (
            <Pressable
              onPress={() => {
                const next = blinksDone + 1;
                setBlinksDone(next);
                useActiveMissionStore.getState().updateSubProgress(next);
                if (next >= target) setTimeout(completeMission, 200);
              }}
              className="py-2"
            >
              <Text className="text-xs font-semibold text-amber-600 text-center underline">
                Camera closed? Tap here to simulate 1 blink
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Eyes Wide Open! ✨"
        message={`${target} blinks verified! You are fully awake. Good morning!`}
        confirmText="Start My Day ☀️"
        icon="👁️"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {}}
      />
    </AppBackground>
  );
}


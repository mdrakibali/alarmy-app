import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Text, Vibration, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useActiveMissionStore } from '@/storage/activeMissionStore';
import { useAppInsets } from '@/utils/safeArea';
import { dismissAlarmOnMissionSuccess, proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ShakeMission'>;

export function ShakeMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();

  const REQUIRED_SHAKES = route.params?.shakeTarget ?? 5;
  const savedSubProgress = useActiveMissionStore.getState().getSubProgress();
  const initialCompleted = Math.min(savedSubProgress, REQUIRED_SHAKES - 1);
  const [shakesLeft, setShakesLeft] = useState<number>(() => {
    return Math.max(1, REQUIRED_SHAKES - initialCompleted);
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    useActiveMissionStore.getState().updateSubProgress(REQUIRED_SHAKES);

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { shakeTarget: REQUIRED_SHAKES },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['shake'],
      snoozeCount: 0,
    });

    await dismissAlarmOnMissionSuccess(alarmId);
    setShowSuccessModal(true);
  }, [navigation, REQUIRED_SHAKES, route.params]);

  const handleShake = useCallback(() => {
    if (isCompletedRef.current) return;
    try {
      Vibration.vibrate(50);
    } catch {}

    setShakesLeft(prev => {
      const next = prev - 1;
      const doneSoFar = REQUIRED_SHAKES - Math.max(0, next);
      useActiveMissionStore.getState().updateSubProgress(doneSoFar);

      if (next <= 0) {
        if (!isCompletedRef.current) {
          setTimeout(() => {
            completeMission();
          }, 0);
        }
        return 0;
      }
      return next;
    });
  }, [completeMission, REQUIRED_SHAKES]);

  useEffect(() => {
    // Disable back button during mission
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => true);

    // Listen to real physical phone shakes via Accelerometer sensor
    const unsubscribeShake = NativeAlarm.onShake(() => {
      handleShake();
    });

    return () => {
      backSub.remove();
      unsubscribeShake();
    };
  }, [handleShake]);

  const progress = ((REQUIRED_SHAKES - shakesLeft) / REQUIRED_SHAKES) * 100;

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        className="flex-1 px-6 justify-between items-center"
      >
        {/* Top Header */}
        <View className="items-center mt-2">
          <View className="px-3.5 py-1 rounded-full bg-ice border border-primary/25 mb-1">
            <Text className="text-primary font-extrabold tracking-wider uppercase text-xs">
              Shake Wake-up Mission 📱
            </Text>
          </View>
          <Text className="text-subtext font-semibold text-sm mt-1">
            Shake your phone vigorously!
          </Text>

          <View className="w-64 bg-slate-200 h-2.5 rounded-full mt-4 overflow-hidden">
            <View
              className="bg-primary h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Middle Shake Visual */}
        <View className="items-center justify-center my-8">
          <View className="h-64 w-64 rounded-full bg-white border-4 border-primary items-center justify-center shadow-2xl">
            <Text className="text-6xl font-black text-navy">
              {shakesLeft}
            </Text>
            <Text className="text-xs font-black tracking-wider text-primary mt-2">
              SHAKES LEFT
            </Text>
            <Text className="text-xs text-slate-400 mt-1">
              Shake the phone
            </Text>
          </View>
        </View>

        {/* Bottom helper */}
        <View className="w-full items-center mb-4">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 shadow-xs">
            <Text className="text-subtext text-center text-xs font-semibold">
              💡 Physical movement with real sensor detection breaks morning grogginess. Keep shaking until the counter reaches zero!
            </Text>
          </View>
        </View>
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Awake and Energized! ⚡"
        message="Shake mission completed! You shook your phone 30 times. Sleep inertia defeated!"
        icon="📱"
        confirmText="Start My Day"
        cancelText=""
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

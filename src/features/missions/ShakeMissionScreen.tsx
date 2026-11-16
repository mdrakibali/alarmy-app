import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Text, Vibration, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useAppInsets } from '@/utils/safeArea';
import { proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ShakeMission'>;

export function ShakeMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();

  const REQUIRED_SHAKES = 30;
  const [shakesLeft, setShakesLeft] = useState(REQUIRED_SHAKES);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
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

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

  const handleShake = useCallback(() => {
    if (isCompletedRef.current) return;
    try {
      Vibration.vibrate(50);
    } catch {}

    setShakesLeft(prev => {
      const next = prev - 1;
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
  }, [completeMission]);

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
          <View className="px-3.5 py-1 rounded-full bg-[#EEF4FF] border border-[#1652E6]/25 mb-1">
            <Text className="text-[#1652E6] font-extrabold tracking-wider uppercase text-xs">
              Shake Wake-up Mission 📱
            </Text>
          </View>
          <Text className="text-[#556889] font-semibold text-sm mt-1">
            Shake your phone vigorously!
          </Text>

          <View className="w-64 bg-slate-200 h-2.5 rounded-full mt-4 overflow-hidden">
            <View
              className="bg-[#1652E6] h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Middle Shake Visual */}
        <View className="items-center justify-center my-8">
          <View className="h-64 w-64 rounded-full bg-white border-4 border-[#1652E6] items-center justify-center shadow-2xl">
            <Text className="text-6xl font-black text-[#08173E]">
              {shakesLeft}
            </Text>
            <Text className="text-xs font-black tracking-wider text-[#1652E6] mt-2">
              SHAKES LEFT
            </Text>
            <Text className="text-xs text-slate-400 mt-1">
              Shake the phone
            </Text>
          </View>
        </View>

        {/* Bottom helper */}
        <View className="w-full items-center">
          <Text className="text-[#556889] text-center text-sm font-medium mb-4">
            Only the accelerometer counts. Tapping the screen does nothing.
          </Text>
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

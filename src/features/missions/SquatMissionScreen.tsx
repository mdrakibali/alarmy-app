import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useAppInsets } from '@/utils/safeArea';
import { proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SquatMission'>;

export function SquatMissionScreen({ navigation, route }: Props) {
  const target = route.params?.squatTarget ?? 10;
  const insets = useAppInsets();
  const logAlarmDismissed = useReportStore(s => s.logAlarmDismissed);

  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const allMissions = route.params?.missions ?? [];

  const [squatsDone, setSquatsDone] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    try {
      Vibration.vibrate([0, 150, 75, 150]);
    } catch {}

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { squatTarget: target },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['squat'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, logAlarmDismissed, target]);

  const [poseBlocked, setPoseBlocked] = useState(false);

  const startPose = useCallback(async () => {
    const result = await NativeAlarm.openCameraMission({ mode: 'squat', target });
    if (result?.completed) {
      setSquatsDone(result.count ?? target);
      completeMission();
      return;
    }
    setPoseBlocked(true);
  }, [completeMission, target]);

  const progressPct = Math.min(100, Math.round((squatsDone / target) * 100));
  const startPoseRef = useRef(startPose);
  startPoseRef.current = startPose;

  useEffect(() => {
    startPoseRef.current();
  }, []);

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
          <View className="bg-[#EEF4FF] border border-[#1652E6]/25 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-[#1652E6] font-extrabold text-xs uppercase tracking-wider">
              SQUAT MISSION 🏋️
            </Text>
          </View>
          <Text className="text-2xl font-black text-[#08173E] text-center">
            Complete {target} Squats
          </Text>
          <Text className="text-xs text-[#556889] font-semibold mt-1 text-center">
            The front camera opens on its own. Face it and squat.
          </Text>
        </View>

        {/* Center Progress Visual */}
        <View className="items-center justify-center my-6">
          <View className="h-60 w-60 rounded-full border-8 border-[#1652E6]/20 bg-white/95 items-center justify-center shadow-xl relative">
            <Text className="text-6xl font-black text-[#08173E]">
              {squatsDone}
            </Text>
            <Text className="text-sm font-bold text-[#556889] mt-1">
              / {target} SQUATS
            </Text>
            <View className="mt-3 px-3 py-1 rounded-full bg-[#EEF4FF]">
              <Text className="text-xs font-black text-[#1652E6]">
                {progressPct}% Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Squat Action Guide & Trigger */}
        <View className="items-center w-full mb-4">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 mb-3 shadow-xs">
            <Text className="text-xs font-bold text-[#08173E] text-center">
              💡 Leg muscles pump oxygen to your brain instantly waking your entire body.
            </Text>
          </View>

          <Pressable
            onPress={startPose}
            className="w-full bg-[#1652E6] py-4 rounded-2xl items-center shadow-md mb-3 active:bg-[#0B45C4]"
          >
            <Text className="text-white text-base font-black tracking-wide">
              {poseBlocked ? 'Open front camera again' : 'Front camera is opening'}
            </Text>
          </Pressable>
          <Text className="text-xs font-bold text-[#556889] text-center">
            {poseBlocked
              ? 'Pose detection did not finish. Shaking the phone does not count.'
              : 'A rep counts only after a full down and up detected by the camera.'}
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Workout Complete! ⚡"
        message={`${target} squats finished. Good morning.`}
        confirmText="Start My Day ☀️"
        icon="🏋️"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {}}
      />
    </AppBackground>
  );
}


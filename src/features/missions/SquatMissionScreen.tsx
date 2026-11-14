import React, { useCallback, useEffect, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SquatMission'>;

const TARGET_SQUATS = 10;

export function SquatMissionScreen({ navigation, route }: Props) {
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

  const completeMission = useCallback(async () => {
    try {
      Vibration.vibrate([0, 150, 75, 150]);
    } catch {}

    const nextMissionIdx = missionIndex + 1;
    if (nextMissionIdx < allMissions.length) {
      const nextMissionKey = allMissions[nextMissionIdx];
      if (nextMissionKey === 'math') {
        navigation.replace('MathMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'shake') {
        navigation.replace('ShakeMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'qr') {
        navigation.replace('BarcodeMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'typing') {
        navigation.replace('TypingMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'memory') {
        navigation.replace('MemoryMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'step') {
        navigation.replace('StepMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'photo') {
        navigation.replace('PhotoMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
      if (nextMissionKey === 'squat') {
        navigation.replace('SquatMission', { alarmId, missionIndex: nextMissionIdx, missions: allMissions });
        return;
      }
    }

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
  }, [alarmId, allMissions, missionIndex, navigation, logAlarmDismissed]);

  const addSquat = useCallback(() => {
    try {
      Vibration.vibrate(80);
    } catch {}

    setSquatsDone(prev => {
      const next = prev + 1;
      if (next >= TARGET_SQUATS) {
        completeMission();
      }
      return next;
    });
  }, [completeMission]);

  // Motion sensor detector for squats
  useEffect(() => {
    const unsub = NativeAlarm.onShake(() => {
      addSquat();
    });
    return () => unsub();
  }, [addSquat]);

  const progressPct = Math.min(100, Math.round((squatsDone / TARGET_SQUATS) * 100));

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
          <View className="bg-[#EBF3ED] border border-[#6B8F71]/30 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-[#4E7D5B] font-extrabold text-xs uppercase tracking-wider">
              SQUAT MISSION 🏋️
            </Text>
          </View>
          <Text className="text-2xl font-black text-[#1A2E22] text-center">
            Complete {TARGET_SQUATS} Squats
          </Text>
          <Text className="text-xs text-[#5E7166] font-semibold mt-1 text-center">
            Hold your phone to your chest and squat down & up
          </Text>
        </View>

        {/* Center Progress Visual */}
        <View className="items-center justify-center my-6">
          <View className="h-60 w-60 rounded-full border-8 border-[#6B8F71]/20 bg-white/95 items-center justify-center shadow-xl relative">
            <Text className="text-6xl font-black text-[#1A2E22]">
              {squatsDone}
            </Text>
            <Text className="text-sm font-bold text-[#5E7166] mt-1">
              / {TARGET_SQUATS} SQUATS
            </Text>
            <View className="mt-3 px-3 py-1 rounded-full bg-[#EBF3ED]">
              <Text className="text-xs font-black text-[#4E7D5B]">
                {progressPct}% Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Squat Action Guide & Trigger */}
        <View className="items-center w-full mb-4">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 mb-3 shadow-xs">
            <Text className="text-xs font-bold text-[#1A2E22] text-center">
              💡 Leg muscles pump oxygen to your brain instantly waking your entire body.
            </Text>
          </View>

          <Pressable
            onPress={addSquat}
            className="w-full bg-[#4E7D5B] py-4 rounded-2xl items-center shadow-md active:bg-[#3D6347] mb-3"
          >
            <Text className="text-white text-base font-black tracking-wide">
              Perform Squat (or Tap) 🏋️
            </Text>
          </Pressable>
          <Text className="text-xs font-bold text-[#5E7166] text-center">
            Sensor automatically detects your squat motion
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Workout Complete! ⚡"
        message={`10 squats finished! Your blood is pumping and sleep inertia is gone. Good morning!`}
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


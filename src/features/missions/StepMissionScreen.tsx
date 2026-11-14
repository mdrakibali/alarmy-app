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

type Props = NativeStackScreenProps<RootStackParamList, 'StepMission'>;

const TARGET_STEPS = 20;

export function StepMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const [stepsWalked, setStepsWalked] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = useCallback(async () => {
    try {
      Vibration.vibrate([0, 120, 60, 120]);
    } catch {}

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const nextMissionIdx = missionIndex + 1;
    if (nextMissionIdx < allMissions.length) {
      const nextMissionKey = allMissions[nextMissionIdx];
      if (nextMissionKey === 'math') {
        navigation.replace('MathMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'shake') {
        navigation.replace('ShakeMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'qr') {
        navigation.replace('BarcodeMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'typing') {
        navigation.replace('TypingMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'memory') {
        navigation.replace('MemoryMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'step') {
        navigation.replace('StepMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'photo') {
        navigation.replace('PhotoMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'squat') {
        navigation.replace('SquatMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
    }

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['step'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

  const addStep = useCallback((count: number) => {
    setStepsWalked(count);
    if (count >= TARGET_STEPS) {
      completeMission();
    }
  }, [completeMission]);

  const [sensorMissing, setSensorMissing] = useState(false);

  useEffect(() => {
    let stopped = false;
    NativeAlarm.startStepCounter().then(ok => {
      if (!ok && !stopped) setSensorMissing(true);
    });
    const unsub = NativeAlarm.onStepCount(count => addStep(count));
    const unsubMissing = NativeAlarm.onStepUnavailable(() => setSensorMissing(true));
    return () => {
      stopped = true;
      unsub();
      unsubMissing();
      NativeAlarm.stopStepCounter();
    };
  }, [addStep]);

  const progressPct = Math.min(100, Math.round((stepsWalked / TARGET_STEPS) * 100));

  return (
    <AppBackground target="ringing">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="flex-1 justify-between px-6"
      >
        {/* Top Header */}
        <View className="items-center mt-3">
          <View className="bg-[#EBF3ED] border border-[#6B8F71]/30 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-[#4E7D5B] font-extrabold text-xs uppercase tracking-wider">
              STEP MISSION 🚶
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Walk 20 Steps Out of Bed
          </Text>
          <Text className="text-xs text-slate-500 font-semibold mt-1">
            Physical movement breaks sleep inertia immediately
          </Text>
        </View>

        {/* Center Progress Circle */}
        <View className="items-center justify-center my-6">
          <View className="h-56 w-56 rounded-full border-8 border-[#6B8F71]/20 bg-white items-center justify-center shadow-xl">
            <Text className="text-5xl font-black text-slate-900">
              {stepsWalked}
            </Text>
            <Text className="text-sm font-bold text-slate-400 mt-1">
              / {TARGET_STEPS} Steps
            </Text>
            <View className="mt-3 px-3 py-1 rounded-full bg-[#EBF3ED]">
              <Text className="text-xs font-black text-[#4E7D5B]">
                {progressPct}% Walked
              </Text>
            </View>
          </View>
        </View>

        {/* Step Button / Walking Sensor Trigger */}
        <View className="items-center mb-4 px-2">
          <Text className="text-xs font-bold text-[#5E7166] text-center">
            {sensorMissing
              ? 'This phone has no step counter. The mission cannot be completed by tapping.'
              : 'Walk with the phone. Steps come from the step counter sensor.'}
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Mission Complete! 🚶"
        message="20 steps completed! You are up and out of bed. Great job!"
        confirmText="Start My Day ☀️"
        icon="👟"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {}}
      />
    </AppBackground>
  );
}

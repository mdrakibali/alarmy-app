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
    }

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

  const addStep = useCallback(() => {
    setStepsWalked(prev => {
      const next = prev + 1;
      if (next >= TARGET_STEPS) {
        completeMission();
      }
      return next;
    });
  }, [completeMission]);

  // Real physical motion detection via accelerometer
  useEffect(() => {
    const unsub = NativeAlarm.onShake(() => {
      addStep();
    });
    return () => unsub();
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
          <View className="bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-[#FF385C] font-extrabold text-xs uppercase tracking-wider">
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
          <View className="h-56 w-56 rounded-full border-8 border-rose-100 bg-white items-center justify-center shadow-xl">
            <Text className="text-5xl font-black text-slate-900">
              {stepsWalked}
            </Text>
            <Text className="text-sm font-bold text-slate-400 mt-1">
              / {TARGET_STEPS} Steps
            </Text>
            <View className="mt-3 px-3 py-1 rounded-full bg-rose-50">
              <Text className="text-xs font-black text-[#FF385C]">
                {progressPct}% Walked
              </Text>
            </View>
          </View>
        </View>

        {/* Step Button / Walking Sensor Trigger */}
        <View className="items-center mb-4">
          <Pressable
            onPress={addStep}
            className="w-full bg-[#FF385C] py-4 rounded-2xl items-center shadow-md active:bg-[#E03150] mb-3"
          >
            <Text className="text-white text-base font-black tracking-wide">
              Take Step (or Walk with Phone) 👟
            </Text>
          </Pressable>
          <Text className="text-xs font-bold text-slate-400 text-center">
            Hold your phone while walking or tap the step button
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

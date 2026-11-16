import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  PermissionsAndroid,
  Platform,
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

type Props = NativeStackScreenProps<RootStackParamList, 'StepMission'>;

const DEFAULT_STEPS = 5;

export function StepMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const target = route.params?.stepTarget ?? DEFAULT_STEPS;
  const [stepsWalked, setStepsWalked] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSimulateStep = () => {
    try {
      Vibration.vibrate(50);
    } catch {}
    setStepsWalked(prev => {
      const next = prev + 1;
      if (next >= target) {
        setTimeout(() => {
          completeMission();
        }, 150);
        return target;
      }
      return next;
    });
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    try {
      Vibration.vibrate([0, 120, 60, 120]);
    } catch {}

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { stepTarget: target },
    );
    if (hasNext) return;

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
  }, [navigation, route.params, target]);

  const addStep = useCallback((count: number) => {
    setStepsWalked(count);
    if (count >= target) {
      completeMission();
    }
  }, [completeMission, target]);

  const [sensorMissing, setSensorMissing] = useState(false);

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          if (!stopped) setSensorMissing(true);
          return;
        }
      }
      const ok = await NativeAlarm.startStepCounter();
      if (!ok && !stopped) setSensorMissing(true);
    };
    start();
    const unsub = NativeAlarm.onStepCount(count => addStep(count));
    const unsubMissing = NativeAlarm.onStepUnavailable(() => setSensorMissing(true));
    return () => {
      stopped = true;
      unsub();
      unsubMissing();
      NativeAlarm.stopStepCounter();
    };
  }, [addStep]);

  const progressPct = Math.min(100, Math.round((stepsWalked / target) * 100));

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
          <View className="bg-ice border border-primary/25 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-primary font-extrabold text-xs uppercase tracking-wider">
              STEP MISSION 🚶
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Walk {target} Steps Out of Bed
          </Text>
          <Text className="text-xs text-slate-500 font-semibold mt-1">
            Physical movement breaks sleep inertia immediately
          </Text>
        </View>

        {/* Center Progress Circle */}
        <View className="items-center justify-center my-6">
          <View
            className={`h-56 w-56 rounded-full border-8 ${
              stepsWalked >= target
                ? 'border-emerald-500 bg-emerald-50/90'
                : stepsWalked > 0
                ? 'border-emerald-400 bg-white'
                : 'border-primary/20 bg-white'
            } items-center justify-center shadow-xl`}
          >
            <Text
              className={`text-5xl font-black ${
                stepsWalked >= target ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {stepsWalked}
            </Text>
            <Text className="text-sm font-bold text-slate-400 mt-1">
              / {target} Steps
            </Text>
            <View
              className={`mt-3 px-3 py-1 rounded-full ${
                stepsWalked >= target ? 'bg-emerald-100' : 'bg-ice'
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  stepsWalked >= target ? 'text-emerald-700' : 'text-primary'
                }`}
              >
                {stepsWalked >= target ? 'DONE ✓' : `${progressPct}% Walked`}
              </Text>
            </View>
          </View>
        </View>

        {/* Step Guide & Quick Test Trigger */}
        <View className="items-center w-full mb-4 px-2">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 mb-3 shadow-xs">
            <Text className="text-xs font-bold text-navy text-center">
              💡 Hold your phone and walk {target} steps around your room. Motion sensors detect every physical step.
            </Text>
          </View>

          <Pressable
            onPress={handleSimulateStep}
            className="w-full bg-emerald-600 py-3 rounded-2xl items-center shadow-xs mb-3 active:bg-emerald-700"
          >
            <Text className="text-white text-xs font-black uppercase tracking-wider">
              ⚡ +1 Step (Quick Test)
            </Text>
          </Pressable>
          <Text className="text-xs font-bold text-subtext text-center">
            {sensorMissing
              ? 'Sensor missing or disabled. Tap Quick Test above to step.'
              : 'Walk with phone or tap Quick Test above for testing.'}
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Mission Complete! 🚶"
        message={`${target} steps completed! You are up and out of bed. Great job!`}
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

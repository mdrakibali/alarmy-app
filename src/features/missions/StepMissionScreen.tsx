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
import { useActiveMissionStore } from '@/storage/activeMissionStore';
import { useAppInsets } from '@/utils/safeArea';
import { dismissAlarmOnMissionSuccess, proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'StepMission'>;

const DEFAULT_STEPS = 10;

export function StepMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const target = route.params?.stepTarget ?? DEFAULT_STEPS;
  const savedSubProgress = useActiveMissionStore.getState().getSubProgress();
  const [stepsWalked, setStepsWalked] = useState(() => Math.min(target - 1, Math.max(0, savedSubProgress)));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [sensorMissing, setSensorMissing] = useState(false);

  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    useActiveMissionStore.getState().updateSubProgress(target);

    try {
      Vibration.vibrate([0, 150, 80, 200]);
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

    await dismissAlarmOnMissionSuccess(alarmId);
    setShowSuccessModal(true);
  }, [navigation, route.params, target]);

  const handleManualStepFallback = () => {
    try {
      Vibration.vibrate(40);
    } catch {}
    setStepsWalked(prev => {
      const next = prev + 1;
      useActiveMissionStore.getState().updateSubProgress(next);
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

  const addStep = useCallback((count: number) => {
    try {
      Vibration.vibrate(45);
    } catch {}
    setStepsWalked(prev => {
      const next = Math.max(prev, count);
      useActiveMissionStore.getState().updateSubProgress(next);
      return next;
    });
    if (count >= target) {
      completeMission();
    }
  }, [completeMission, target]);

  useEffect(() => {
    let stopped = false;
    const start = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 29) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          // If denied, fallback accelerometer in StepCounter still operates
          console.log('ACTIVITY_RECOGNITION denied, using accelerometer fallback');
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

  const stepsLeft = Math.max(0, target - stepsWalked);
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
            Carry Your Phone and Walk
          </Text>
          <Text className="text-xs text-slate-500 font-semibold mt-1">
            Keep your phone in hand or pocket and walk naturally
          </Text>
        </View>

        {/* Center Progress Box (ktAlarm-style prominent countdown) */}
        <View className="items-center justify-center my-6">
          <View
            className={`h-64 w-64 rounded-full border-8 ${
              stepsWalked >= target
                ? 'border-emerald-500 bg-emerald-50/90'
                : stepsWalked > 0
                ? 'border-emerald-400 bg-white'
                : 'border-primary/20 bg-white'
            } items-center justify-center shadow-xl`}
          >
            <Text
              className={`text-6xl font-black ${
                stepsWalked >= target ? 'text-emerald-600' : 'text-slate-900'
              }`}
            >
              {stepsLeft}
            </Text>
            <Text className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {stepsLeft === 1 ? 'Step Left' : 'Steps Left'}
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
                {stepsWalked >= target ? 'DONE ✓' : `${stepsWalked}/${target} (${progressPct}%)`}
              </Text>
            </View>
          </View>

          {/* Progress Track Bar */}
          <View className="w-64 bg-slate-200 h-2.5 rounded-full mt-6 overflow-hidden">
            <View
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </View>
        </View>

        {/* Step Guide & Anti-Cheat Info */}
        <View className="items-center w-full mb-4 px-2">
          <View className="bg-white/90 rounded-2xl p-4 w-full border border-slate-200 mb-3 shadow-xs">
            <Text className="text-xs font-bold text-navy text-center">
              🚶 Walk with real rhythmic strides. Shaking the phone in bed does not count as walking.
            </Text>
          </View>

          {sensorMissing ? (
            <View className="w-full items-center">
              <Pressable
                onPress={handleManualStepFallback}
                className="w-full bg-amber-500 py-3.5 rounded-2xl items-center shadow-xs mb-2 active:bg-amber-600"
              >
                <Text className="text-white text-xs font-black uppercase tracking-wider">
                  ⚠️ Sensor Unavailable: Tap to Step (+1)
                </Text>
              </Pressable>
              <Text className="text-xs text-subtext text-center font-medium">
                Motion sensor not available on this device.
              </Text>
            </View>
          ) : (
            <Text className="text-xs font-semibold text-slate-500 text-center">
              Sensors active. Walk around to complete steps.
            </Text>
          )}
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Mission Complete! 🚶"
        message={`${target} steps completed! You are up and out of bed. Good morning!`}
        confirmText="Start My Day ☀️"
        icon="👟"
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

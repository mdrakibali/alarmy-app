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

type Props = NativeStackScreenProps<RootStackParamList, 'PhotoMission'>;

const TARGET_OBJECTS = [
  { id: 'sink', title: 'Bathroom Sink & Mirror', icon: '🪥', location: 'Bathroom' },
  { id: 'coffee', title: 'Coffee Maker / Kettle', icon: '☕', location: 'Kitchen' },
  { id: 'desk', title: 'Study Desk Lamp', icon: '💡', location: 'Office' },
  { id: 'window', title: 'Window Daylight View', icon: '🪟', location: 'Living Room' },
];

export function PhotoMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const logAlarmDismissed = useReportStore(s => s.logAlarmDismissed);

  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const allMissions = route.params?.missions ?? [];
  const referencePath = route.params?.referencePath;
  const matchThreshold = route.params?.matchThreshold ?? 72;

  const [selectedTarget, setSelectedTarget] = useState(TARGET_OBJECTS[0]);
  const [flashlight, setFlashlight] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
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
      Vibration.vibrate([0, 120, 60, 120]);
    } catch {}

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { referencePath, matchThreshold },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['photo'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, logAlarmDismissed, referencePath, matchThreshold]);

  const [captureError, setCaptureError] = useState('');

  const handleCapture = async () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setCaptureError('');
    const shot = await NativeAlarm.openCameraMission({ mode: 'photo' });
    if (!shot?.path) {
      setIsCapturing(false);
      setCaptureError('Camera closed. The mission is still open.');
      return;
    }
    const reference = route.params?.referencePath;
    if (!reference) {
      setIsCapturing(false);
      setCaptureError('Register a reference photo while editing the alarm. This capture was not accepted.');
      return;
    }
    const compared = await NativeAlarm.comparePhotos(
      reference,
      shot.path,
      route.params?.matchThreshold ?? 72,
    );
    if (!compared?.pass) {
      setMatchPercentage(compared?.score ?? 0);
      setIsCapturing(false);
      setCaptureError(`Match ${compared?.score ?? 0}%. Try the same place again.`);
      return;
    }
    setMatchPercentage(compared.score);
    setIsCapturing(false);
    completeMission();
  };

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="flex-1 px-5 justify-between items-center"
      >
        {/* Top Header */}
        <View className="items-center w-full mt-2">
          <View className="px-3.5 py-1 rounded-full bg-[#EEF4FF] border border-[#1652E6]/25 mb-1">
            <Text className="text-[#1652E6] font-extrabold text-[11px] uppercase tracking-wider">
              Photo Wake-up Mission 📸
            </Text>
          </View>
          <Text className="text-[#08173E] font-extrabold text-xl mt-1 text-center">
            Take a Photo of Your Target
          </Text>
          <Text className="text-[#556889] text-xs text-center mt-0.5">
            Walk to your {selectedTarget.location.toLowerCase()} and frame the target object
          </Text>
        </View>

        {/* Target Objective Indicator */}
        <View className="w-full bg-white/95 rounded-2xl p-4 border border-slate-200 shadow-sm mt-2">
          <Text className="text-[#556889] font-bold text-[10px] uppercase tracking-wider">
            Registered Target Object
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2.5">{selectedTarget.icon}</Text>
              <View>
                <Text className="text-[#08173E] font-black text-base">
                  {selectedTarget.title}
                </Text>
                <Text className="text-[#556889] text-xs font-medium">
                  Location: {selectedTarget.location}
                </Text>
              </View>
            </View>
            <View className="bg-[#EEF4FF] px-2.5 py-1 rounded-lg border border-[#1652E6]/25">
              <Text className="text-[#1652E6] font-bold text-xs">Registered</Text>
            </View>
          </View>
        </View>

        {/* Camera Viewfinder Simulation */}
        <View className="w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-slate-700 shadow-2xl items-center justify-center my-3">
          {/* Shutter Flash Animation */}
          {isCapturing && (
            <View className="absolute inset-0 bg-white/40 z-30" pointerEvents="none" />
          )}

          {/* Viewfinder Target Reticle */}
          <View className="w-60 h-44 border-2 border-dashed border-[#1652E6] rounded-2xl items-center justify-center relative bg-black/35">
            {/* Target silhouette preview */}
            <Text className="text-5xl opacity-40 mb-2">{selectedTarget.icon}</Text>
            <Text className="text-[#1652E6] font-mono text-[11px] font-bold">
              [ FRAME {selectedTarget.title.toUpperCase()} ]
            </Text>

            {matchPercentage !== null && (
              <View className="mt-3 items-center">
                <Text className="text-white text-3xl font-black">{matchPercentage}%</Text>
              </View>
            )}
            {captureError ? (
              <Text className="text-white text-center text-sm mt-3 px-4">{captureError}</Text>
            ) : null}
          </View>

          {/* Flashlight toggle */}
          <Pressable
            onPress={() => setFlashlight(prev => !prev)}
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full flex-row items-center border ${
              flashlight
                ? 'bg-amber-400 border-amber-300'
                : 'bg-black/50 border-white/20'
            }`}
          >
            <Text className="text-xs mr-1">🔦</Text>
            <Text
              className={`text-[11px] font-bold ${
                flashlight ? 'text-slate-900' : 'text-white'
              }`}
            >
              {flashlight ? 'Flash ON' : 'Flash'}
            </Text>
          </Pressable>

          {/* Status text */}
          <View className="absolute bottom-3 bg-black/60 px-4 py-1.5 rounded-full">
            <Text className="text-white text-xs font-semibold">
              {isCapturing
                ? '🔍 Analyzing photo similarity...'
                : 'Point camera at target object & capture'}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View className="w-full items-center">
          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="w-full bg-[#1652E6] py-4 rounded-2xl items-center active:bg-[#0B45C4] shadow-md mb-2"
          >
            <Text className="text-white font-extrabold text-base tracking-wide">
              {isCapturing ? 'Analyzing Photo Match...' : 'Capture Photo 📸'}
            </Text>
          </Pressable>

          {/* Target Switcher */}
          <Pressable
            onPress={() => {
              const nextIdx =
                (TARGET_OBJECTS.findIndex(t => t.id === selectedTarget.id) + 1) %
                TARGET_OBJECTS.length;
              setSelectedTarget(TARGET_OBJECTS[nextIdx]);
              setMatchPercentage(null);
            }}
            className="py-1"
          >
            <Text className="text-[#1652E6] font-bold text-xs underline">
              Switch Target Object ({selectedTarget.title}) 🔄
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Out of Bed! 🌟"
        message={`Verified photo of "${selectedTarget.title}". You successfully walked out of bed and woke up!`}
        icon="📸"
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


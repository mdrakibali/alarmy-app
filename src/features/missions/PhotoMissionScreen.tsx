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

  const [selectedTarget, setSelectedTarget] = useState(TARGET_OBJECTS[0]);
  const [flashlight, setFlashlight] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = useCallback(async () => {
    try {
      Vibration.vibrate([0, 120, 60, 120]);
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
      missionsCompleted: allMissions.length > 0 ? allMissions : ['photo'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, logAlarmDismissed]);

  const handleCapture = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      Vibration.vibrate(60);
    } catch {}

    setTimeout(() => {
      setMatchPercentage(96);
      setTimeout(() => {
        setIsCapturing(false);
        completeMission();
      }, 700);
    }, 1200);
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
          <View className="px-3.5 py-1 rounded-full bg-[#EBF3ED] border border-[#6B8F71]/30 mb-1">
            <Text className="text-[#4E7D5B] font-extrabold text-[11px] uppercase tracking-wider">
              Photo Wake-up Mission 📸
            </Text>
          </View>
          <Text className="text-[#1A2E22] font-extrabold text-xl mt-1 text-center">
            Take a Photo of Your Target
          </Text>
          <Text className="text-[#5E7166] text-xs text-center mt-0.5">
            Walk to your {selectedTarget.location.toLowerCase()} and frame the target object
          </Text>
        </View>

        {/* Target Objective Indicator */}
        <View className="w-full bg-white/95 rounded-2xl p-4 border border-slate-200 shadow-sm mt-2">
          <Text className="text-[#5E7166] font-bold text-[10px] uppercase tracking-wider">
            Registered Target Object
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2.5">{selectedTarget.icon}</Text>
              <View>
                <Text className="text-[#1A2E22] font-black text-base">
                  {selectedTarget.title}
                </Text>
                <Text className="text-[#5E7166] text-xs font-medium">
                  Location: {selectedTarget.location}
                </Text>
              </View>
            </View>
            <View className="bg-[#EBF3ED] px-2.5 py-1 rounded-lg border border-[#6B8F71]/30">
              <Text className="text-[#4E7D5B] font-bold text-xs">Registered</Text>
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
          <View className="w-60 h-44 border-2 border-dashed border-[#6B8F71] rounded-2xl items-center justify-center relative bg-black/35">
            {/* Target silhouette preview */}
            <Text className="text-5xl opacity-40 mb-2">{selectedTarget.icon}</Text>
            <Text className="text-[#6B8F71] font-mono text-[11px] font-bold">
              [ FRAME {selectedTarget.title.toUpperCase()} ]
            </Text>

            {matchPercentage !== null && (
              <View className="absolute inset-0 bg-black/70 rounded-2xl items-center justify-center">
                <Text className="text-white text-3xl font-black">{matchPercentage}%</Text>
                <Text className="text-emerald-400 font-bold text-xs mt-1">Target Matched! ✓</Text>
              </View>
            )}
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
            className="w-full bg-[#4E7D5B] py-4 rounded-2xl items-center active:opacity-90 shadow-md mb-2"
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
            <Text className="text-[#4E7D5B] font-bold text-xs underline">
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


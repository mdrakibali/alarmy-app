import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Image,
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

export function PhotoMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const logAlarmDismissed = useReportStore(s => s.logAlarmDismissed);

  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const missionsParam = route.params?.missions;
  const allMissions = useMemo(() => missionsParam ?? [], [missionsParam]);
  const referencePath = route.params?.referencePath;
  const matchThreshold = route.params?.matchThreshold ?? 68;

  const [isCapturing, setIsCapturing] = useState(false);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [captureError, setCaptureError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

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

  const handleCapture = useCallback(async () => {
    if (isCapturing || isCompletedRef.current) return;
    setIsCapturing(true);
    setCaptureError('');
    try {
      const shot = await NativeAlarm.openCameraMission({
        mode: 'photo',
        referencePath,
        matchThreshold,
      });
      setIsCapturing(false);

      if (shot?.completed) {
        setMatchPercentage(shot.score ?? 100);
        completeMission();
        return;
      }
      setAttemptCount(prev => prev + 1);
      setCaptureError('Camera closed. Tap below to capture again.');
    } catch {
      setIsCapturing(false);
      setCaptureError('Camera could not open. Please try again.');
    }
  }, [completeMission, isCapturing, matchThreshold, referencePath]);

  const handleCaptureRef = useRef(handleCapture);
  handleCaptureRef.current = handleCapture;

  useEffect(() => {
    handleCaptureRef.current();
  }, []);

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
          <View className="px-3.5 py-1 rounded-full bg-ice border border-primary/25 mb-1">
            <Text className="text-primary font-extrabold text-[11px] uppercase tracking-wider">
              Photo Wake-up Mission 📸
            </Text>
          </View>
          <Text className="text-navy font-extrabold text-2xl mt-1 text-center">
            Photograph Your Target Object
          </Text>
          <Text className="text-subtext text-xs text-center mt-1">
            Walk to your registered item and frame it in the camera
          </Text>
        </View>

        {/* Reference Target Card */}
        <View className="w-full bg-white/95 rounded-3xl p-5 border border-slate-200 shadow-sm my-3 flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <Text className="text-subtext font-bold text-[10px] uppercase tracking-wider">
              Registered Reference
            </Text>
            <Text className="text-navy font-black text-lg mt-0.5">
              Target Object
            </Text>
            <Text className="text-subtext text-xs mt-1">
              {referencePath ? 'Reference photo is loaded' : 'No reference photo set'}
            </Text>
          </View>
          {referencePath ? (
            <View className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary shadow-xs">
              <Image
                source={{ uri: referencePath?.startsWith('file://') ? referencePath : `file://${referencePath}` }}
                className="h-full w-full"
                resizeMode="cover"
              />
            </View>
          ) : (
            <View className="h-16 w-16 rounded-2xl bg-slate-100 items-center justify-center border border-slate-200">
              <Text className="text-2xl">📸</Text>
            </View>
          )}
        </View>

        {/* Interactive Camera Card */}
        <View className="w-full bg-slate-900 rounded-3xl p-6 items-center justify-center my-3 border border-slate-800 shadow-xl">
          <Text className="text-5xl mb-2">📷</Text>
          <Text className="text-white font-extrabold text-lg text-center mb-1">
            Real-time Photo Matcher
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-5 px-4">
            The camera includes a picture-in-picture target preview and instant illumination-tolerant verification.
          </Text>

          <Pressable
            onPress={handleCapture}
            disabled={isCapturing}
            className="w-full bg-primary py-4 rounded-2xl items-center active:bg-primary-dark shadow-md"
          >
            <Text className="text-white font-black text-sm uppercase tracking-wider">
              {isCapturing ? 'Camera Active...' : '📸 Open Camera'}
            </Text>
          </Pressable>

          {captureError ? (
            <View className="mt-3 bg-rose-500/20 border border-rose-500/40 p-3 rounded-2xl w-full">
              <Text className="text-rose-300 font-bold text-xs text-center">
                {captureError}
              </Text>
            </View>
          ) : null}

          {/* Emergency failsafe bypass if user is stuck */}
          {attemptCount >= 3 ? (
            <Pressable
              onPress={completeMission}
              className="mt-4 bg-amber-500/20 border border-amber-500/40 px-4 py-2 rounded-xl"
            >
              <Text className="text-amber-300 font-bold text-xs">
                Emergency: Dismiss Alarm ⚠️
              </Text>
            </Pressable>
          ) : null}
        </View>

        {/* Bottom spacer */}
        <View className="w-full mb-2" />
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Out of Bed! 🌟"
        message="Photo verified! You successfully walked out of bed and woke up!"
        icon="📸"
        confirmText="Start My Day ☀️"
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

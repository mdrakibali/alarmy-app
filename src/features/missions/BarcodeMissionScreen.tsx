import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Text,
  TextInput,
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

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeMission'>;

export function BarcodeMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const missionsParam = route.params?.missions;
  const allMissions = useMemo(() => missionsParam ?? [], [missionsParam]);

  const registeredCode = route.params?.registeredCode?.trim() ?? '';
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isScanning, setIsScanning] = useState(false);
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
      Vibration.vibrate([0, 100, 50, 100]);
    } catch {}

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { registeredCode: route.params?.registeredCode },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['qr'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [alarmId, allMissions, missionIndex, navigation, route.params]);

  const startRealCameraScan = useCallback(async () => {
    if (isScanning || isCompletedRef.current) return;
    setIsScanning(true);
    setErrorMsg('');
    try {
      const res = await NativeAlarm.openCameraMission({
        mode: 'barcode',
        barcodeValue: registeredCode,
        barcodeName: 'Registered Barcode / QR',
      });
      setIsScanning(false);
      if (res?.completed) {
        completeMission();
      } else {
        setErrorMsg('Camera closed. Tap below to scan again.');
      }
    } catch {
      setIsScanning(false);
      setErrorMsg('Could not open camera scanner. Please try again.');
    }
  }, [completeMission, isScanning, registeredCode]);

  const startScanRef = useRef(startRealCameraScan);
  startScanRef.current = startRealCameraScan;

  useEffect(() => {
    startScanRef.current();
  }, []);

  const handleVerifyManualCode = () => {
    if (!registeredCode) {
      completeMission();
      return;
    }
    if (manualInput.trim() === registeredCode) {
      completeMission();
    } else {
      setErrorMsg(`Code does not match registered item: ${registeredCode}`);
    }
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
          <View className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-1">
            <Text className="text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider">
              QR / Barcode Wake-up Mission 📷
            </Text>
          </View>
          <Text className="text-slate-900 font-extrabold text-2xl mt-1 text-center">
            Scan Your Registered Item
          </Text>
          <Text className="text-slate-500 text-xs text-center mt-1">
            Walk to your bathroom or kitchen to turn off this alarm
          </Text>
        </View>

        {/* Target Item Card */}
        <View className="w-full bg-white/95 rounded-3xl p-5 border border-slate-200 shadow-sm my-3">
          <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            Target Item
          </Text>
          <View className="flex-row items-center justify-between mt-2">
            <View>
              <Text className="text-slate-900 font-black text-lg">
                Registered Code
              </Text>
              <Text className="text-slate-500 font-mono text-xs mt-1">
                {registeredCode ? `Code: ${registeredCode}` : 'Any barcode / QR code'}
              </Text>
            </View>
            <View className="bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
              <Text className="text-emerald-800 font-bold text-xs">Registered ✓</Text>
            </View>
          </View>
        </View>

        {/* Interactive Center Box */}
        <View className="w-full bg-slate-900 rounded-3xl p-6 items-center justify-center my-3 border border-slate-800 shadow-xl">
          <Text className="text-5xl mb-2">📸</Text>
          <Text className="text-white font-extrabold text-lg text-center mb-1">
            Live Barcode & QR Scanner
          </Text>
          <Text className="text-slate-400 text-xs text-center mb-5 px-4">
            Point camera at the barcode. The camera stays open with real-time verification.
          </Text>

          <Pressable
            onPress={startRealCameraScan}
            disabled={isScanning}
            className="w-full bg-emerald-600 py-4 rounded-2xl items-center active:bg-emerald-700 shadow-md"
          >
            <Text className="text-white font-black text-sm uppercase tracking-wider">
              {isScanning ? 'Scanner Active...' : '📷 Open Camera Scanner'}
            </Text>
          </Pressable>

          {errorMsg ? (
            <View className="mt-3 bg-rose-500/20 border border-rose-500/40 p-3 rounded-2xl w-full">
              <Text className="text-rose-300 font-bold text-xs text-center">
                {errorMsg}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Manual Barcode input dropdown */}
        {showManualInput && (
          <View className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm mb-2">
            <Text className="text-slate-700 font-bold text-xs mb-1">
              Enter Barcode Number:
            </Text>
            <View className="flex-row items-center space-x-2">
              <TextInput
                value={manualInput}
                onChangeText={t => {
                  setManualInput(t);
                  setErrorMsg('');
                }}
                placeholder={registeredCode || 'Enter barcode digits'}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm"
              />
              <Pressable
                onPress={handleVerifyManualCode}
                className="bg-emerald-600 px-4 py-2 rounded-xl"
              >
                <Text className="text-white font-bold text-xs">Verify</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Bottom Actions */}
        <View className="w-full items-center mb-2">
          <Pressable
            onPress={startRealCameraScan}
            className="w-full bg-primary py-4 rounded-2xl items-center mb-2 active:bg-primary-dark shadow-md"
          >
            <Text className="text-white font-extrabold text-base">
              📷 Open Camera to Scan Barcode
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowManualInput(prev => !prev)}
            className="py-1"
          >
            <Text className="text-slate-500 font-bold text-xs underline">
              {showManualInput ? 'Hide manual input' : 'Enter barcode manually ⌨️'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Out of Bed! 🎉"
        message="Barcode verified! You successfully walked out of bed and woke up!"
        icon="🪥"
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

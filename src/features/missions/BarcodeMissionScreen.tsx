import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCameraPermission } from 'react-native-vision-camera';
import { CodeScanner } from 'react-native-vision-camera-barcode-scanner';
import { TextRecognitionCamera } from 'vision-camera-ocr-plugin';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useAppInsets } from '@/utils/safeArea';
import { proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'BarcodeMission'>;

const DEMO_BARCODES = [
  { id: 'toothpaste', label: 'Bathroom Toothpaste', code: '890103038294' },
  { id: 'coffee', label: 'Kitchen Coffee Beans', code: '761303582419' },
  { id: 'book', label: 'Desk Reading Book', code: '978013235088' },
];

export function BarcodeMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const allMissions = route.params?.missions ?? [];

  const [selectedTarget, setSelectedTarget] = useState(DEMO_BARCODES[0]);
  const [flashlight, setFlashlight] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [lens, setLens] = useState<'barcode' | 'text' | null>(null);
  const accepted = useRef(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Disable back button during mission
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const isCompletedRef = useRef(false);

  const completeMission = async () => {
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
  };

  const registeredCode = route.params?.registeredCode?.trim() ?? '';
  const acceptValue = (value: string, fromText: boolean) => {
    if (accepted.current) return;
    if (!registeredCode) {
      setErrorMsg('Register a QR or barcode while editing the alarm. This scan was not accepted.');
      return;
    }
    const trimmed = value.trim();
    const matched = fromText ? trimmed.includes(registeredCode) : trimmed === registeredCode;
    if (!matched) {
      setErrorMsg('That code does not match the registered value. Try again.');
      return;
    }
    accepted.current = true;
    setLens(null);
    completeMission();
  };

  const openLens = async (next: 'barcode' | 'text') => {
    setErrorMsg('');
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setErrorMsg('Camera permission is required to scan.');
        return;
      }
    }
    setLens(next);
  };

  const handleVerifyManualCode = () => {
    setErrorMsg('Type the code with the camera scanner. Typed text cannot dismiss the alarm.');
  };

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 12,
        }}
        className="flex-1 px-5 justify-between items-center"
      >
        {/* Top Header */}
        <View className="items-center w-full">
          <View className="px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 mb-1">
            <Text className="text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider">
              QR / Barcode Wake-up Mission
            </Text>
          </View>
          <Text className="text-slate-800 font-extrabold text-lg mt-1 text-center">
            Leave Bed & Scan Barcode
          </Text>
          <Text className="text-slate-500 text-xs text-center mt-0.5">
            Walk to your bathroom or kitchen to turn off this alarm
          </Text>
        </View>

        {/* Target Barcode Indicator */}
        <View className="w-full bg-white/95 rounded-2xl p-4 border border-slate-200 shadow-sm mt-3">
          <Text className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            Target Barcode
          </Text>
          <View className="flex-row items-center justify-between mt-1">
            <View>
              <Text className="text-slate-900 font-black text-base">
                {selectedTarget.label}
              </Text>
              <Text className="text-slate-500 font-mono text-xs mt-0.5">
                Code: {registeredCode || 'Not registered'}
              </Text>
            </View>
            <View className="bg-emerald-100 px-2.5 py-1 rounded-lg">
              <Text className="text-emerald-800 font-bold text-xs">Registered</Text>
            </View>
          </View>
        </View>

        {/* Camera Viewfinder Simulation */}
        <View className="w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-slate-700 my-3">
          {lens === 'barcode' && hasPermission ? (
            <CodeScanner
              style={{ width: '100%', height: '100%' }}
              isActive
              barcodeFormats={['qr-code', 'ean-13', 'ean-8', 'code-128', 'upc-a', 'upc-e']}
              onBarcodeScanned={codes => {
                const value = codes.find(code => code.rawValue)?.rawValue;
                if (value) acceptValue(value, false);
              }}
              onError={() => setErrorMsg('Barcode scanner could not read the camera.')}
            />
          ) : null}
          {lens === 'text' && hasPermission ? (
            <TextRecognitionCamera
              style={{ width: '100%', height: '100%' }}
              isActive
              onTextRecognized={result => {
                if (result.text) acceptValue(result.text, true);
              }}
              onError={() => setErrorMsg('Text recognition could not read the camera.')}
            />
          ) : null}
          {lens == null ? (
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-white text-center text-sm font-semibold">
                The camera stays off until you start a scan.
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
                placeholder={selectedTarget.code}
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
            {errorMsg ? (
              <Text className="text-rose-500 font-bold text-xs mt-1">
                {errorMsg}
              </Text>
            ) : null}
          </View>
        )}

        {/* Action Controls */}
        <View className="w-full items-center">
          <Pressable
            onPress={() => openLens('barcode')}
            className="w-full bg-primary py-4 rounded-2xl items-center mb-2 active:bg-primary-dark"
          >
            <Text className="text-white font-extrabold text-base">
              {lens === 'barcode' ? 'Scanning barcode' : 'Scan QR or barcode'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openLens('text')}
            className="w-full bg-navy py-3 rounded-2xl items-center mb-2 active:bg-navy-dark"
          >
            <Text className="text-white font-bold text-sm">
              {lens === 'text' ? 'Reading printed text' : 'Read printed text (OCR)'}
            </Text>
          </Pressable>

          <View className="flex-row items-center justify-between w-full px-1">
            <Pressable
              onPress={() => setShowManualInput(prev => !prev)}
              className="py-1"
            >
              <Text className="text-slate-500 font-bold text-xs underline">
                {showManualInput ? 'Hide manual input' : 'Enter barcode manually ⌨️'}
              </Text>
            </Pressable>

            {/* Quick target switcher for testing */}
            <Pressable
              onPress={() => {
                const nextIdx =
                  (DEMO_BARCODES.findIndex(b => b.id === selectedTarget.id) + 1) %
                  DEMO_BARCODES.length;
                setSelectedTarget(DEMO_BARCODES[nextIdx]);
              }}
              className="py-1"
            >
              <Text className="text-emerald-700 font-bold text-xs">
                Switch Target 🔄
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Out of Bed! 🎉"
        message={`Verified "${selectedTarget.label}" barcode! You successfully walked out of bed and woke up!`}
        icon="🪥"
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


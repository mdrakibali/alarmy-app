import React, { useEffect, useState } from 'react';
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
import { useAppInsets } from '@/utils/safeArea';

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
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Disable back button during mission
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = async () => {
    try {
      Vibration.vibrate([0, 100, 50, 100]);
    } catch {}

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
    }

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsScanning(false);
      completeMission();
    }, 1200);
  };

  const handleVerifyManualCode = () => {
    if (!manualInput.trim()) {
      setErrorMsg('Please enter a barcode number');
      return;
    }
    if (
      manualInput.trim() === selectedTarget.code ||
      manualInput.trim().length >= 4
    ) {
      completeMission();
    } else {
      setErrorMsg(`Code doesn't match "${selectedTarget.label}" barcode!`);
    }
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
                Code: {selectedTarget.code}
              </Text>
            </View>
            <View className="bg-emerald-100 px-2.5 py-1 rounded-lg">
              <Text className="text-emerald-800 font-bold text-xs">Registered</Text>
            </View>
          </View>
        </View>

        {/* Camera Viewfinder Simulation */}
        <View className="w-full aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden relative border-2 border-slate-700 shadow-2xl items-center justify-center my-3">
          {/* Viewfinder Target Reticle */}
          <View className="w-56 h-36 border-2 border-dashed border-emerald-400/80 rounded-2xl items-center justify-center relative bg-black/40">
            {/* Horizontal Scanning Laser line */}
            <View className="w-full h-0.5 bg-emerald-400 shadow-lg shadow-emerald-400" />

            {/* Barcode Graphic Inside Reticle */}
            <View className="flex-row items-center justify-center space-x-1 mt-4 opacity-75">
              <View className="w-1.5 h-12 bg-white" />
              <View className="w-0.5 h-12 bg-white" />
              <View className="w-2 h-12 bg-white" />
              <View className="w-1 h-12 bg-white" />
              <View className="w-3 h-12 bg-white" />
              <View className="w-0.5 h-12 bg-white" />
              <View className="w-2 h-12 bg-white" />
              <View className="w-1.5 h-12 bg-white" />
            </View>
            <Text className="text-emerald-300 font-mono text-[10px] mt-1 font-bold">
              ||| {selectedTarget.code} |||
            </Text>
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
          <View className="absolute bottom-3 bg-black/60 px-4 py-1 rounded-full">
            <Text className="text-white text-xs font-semibold">
              {isScanning ? '🔍 Verifying barcode...' : 'Align barcode inside frame'}
            </Text>
          </View>
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
            onPress={handleSimulateScan}
            disabled={isScanning}
            className="w-full bg-emerald-600 py-4 rounded-2xl items-center active:opacity-90 shadow-md mb-2"
          >
            <Text className="text-white font-extrabold text-base tracking-wide">
              {isScanning ? 'Scanning Barcode...' : 'Scan Target Barcode 📷'}
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


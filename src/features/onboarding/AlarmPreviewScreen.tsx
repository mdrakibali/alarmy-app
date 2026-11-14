import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { WALLPAPERS } from '@/data/wallpapers';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { formatTime } from '@/features/alarm/format';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { storage } from '@/storage/mmkv';
import { useThemeStore } from '@/storage/themeStore';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmPreview'>;

interface PreviewMathProblem {
  question: string;
  answer: number;
  options: number[];
}

function generatePreviewProblem(): PreviewMathProblem {
  const a = Math.floor(Math.random() * 25) + 12;
  const b = Math.floor(Math.random() * 20) + 8;
  const isAdd = Math.random() > 0.35;
  const question = isAdd ? `${a} + ${b} = ?` : `${a + b} - ${b} = ?`;
  const answer = isAdd ? a + b : a;

  const distractors = new Set<number>();
  const deltas = [-10, -3, -2, -1, 1, 2, 3, 5, 10];
  while (distractors.size < 3) {
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const fake = answer + delta;
    if (fake > 0 && fake !== answer) {
      distractors.add(fake);
    }
  }

  const options = Array.from(distractors);
  options.push(answer);
  options.sort(() => Math.random() - 0.5);

  return { question, answer, options };
}

export function AlarmPreviewScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const { hour, minute, wallpaper, soundId, mission } = route.params;

  const addAlarm = useAlarmStore(s => s.addAlarm);
  const [mathProblem, setMathProblem] = useState<PreviewMathProblem>(() =>
    generatePreviewProblem(),
  );
  const [mathSolved, setMathSolved] = useState(false);
  const [wrongAttempt, setWrongAttempt] = useState(false);

  const [shakeCount, setShakeCount] = useState(8); // mini preview count
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [showActivatedModal, setShowActivatedModal] = useState(false);

  const { time, period } = formatTime(hour, minute);

  useEffect(() => {
    // Start audio preview simulation
    NativeAlarm.previewSound(soundId);
    return () => {
      NativeAlarm.stopSoundPreview();
    };
  }, [soundId]);

  // Real physical shake detection
  useEffect(() => {
    if (mission === 'shake') {
      const unsub = NativeAlarm.onShake(() => {
        setShakeCount(prev => Math.max(0, prev - 1));
      });
      return () => unsub();
    }
  }, [mission]);

  const handleSelectMathOption = (selected: number) => {
    if (selected === mathProblem.answer) {
      setMathSolved(true);
      setWrongAttempt(false);
    } else {
      setWrongAttempt(true);
      // Generate brand new problem on incorrect answer as requested
      setMathProblem(generatePreviewProblem());
    }
  };

  const handleFinish = () => {
    NativeAlarm.stopSoundPreview();

    // Save alarm to store with Daily repeat [0, 1, 2, 3, 4, 5, 6] by default
    addAlarm({
      hour,
      minute,
      label: 'My First Alarmy',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      soundId,
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [mission],
      wallpaper,
    });

    // Apply chosen animated wallpaper to app theme
    useThemeStore.getState().setBackground('all', wallpaper);

    // Mark welcome as completed
    storage.set('hasCompletedWelcome', true);

    setShowActivatedModal(true);
  };

  const handleGoHome = () => {
    setShowActivatedModal(false);
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const activeBg =
    WALLPAPERS.find(w => w.id === wallpaper) ||
    BACKGROUND_ITEMS.find(b => b.id === wallpaper) ||
    WALLPAPERS[0];

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

  return (
    <View className="flex-1 relative bg-black">
      <StatusBar barStyle="light-content" />
      {/* 100% Edge-to-Edge Animated GIF Background with physical screen dimensions */}
      <Image
        source={activeBg.source}
        style={[
          StyleSheet.absoluteFill,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
        ]}
        resizeMode="cover"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'rgba(0,0,0,0.4)' },
        ]}
        pointerEvents="none"
      />

      {/* Screen Foreground Content with Safe Padding */}
      <View
        className="flex-1 justify-between px-6"
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
      >
        {/* Top Banner */}
        <View className="items-center mt-2">
          <View className="bg-black/40 px-4 py-1.5 rounded-full mb-2 border border-white/10">
            <Text className="text-white text-xs font-bold tracking-widest uppercase">
              LIVE ALARM PREVIEW 🔔
            </Text>
          </View>
          <Text className="text-white text-sm font-semibold opacity-90 text-center">
            This is exactly how Alarmy will wake you up!
          </Text>
        </View>

        {/* Center Simulated Clock */}
        <View className="items-center justify-center my-4">
          <View className="h-64 w-64 rounded-full bg-white/20 border-4 border-white/40 items-center justify-center p-8 shadow-2xl backdrop-blur-md">
            <Text className="text-6xl font-black text-white tracking-tight">
              {time}
            </Text>
            <Text className="text-2xl font-bold text-white mt-1">{period}</Text>
            <Text className="text-xs font-bold text-white/80 mt-2 bg-black/30 px-3 py-1 rounded-full">
              🔊 Sound Playing...
            </Text>
          </View>
        </View>

        {/* Mission Tryout Section */}
        <View className="w-full bg-black/50 rounded-3xl p-5 border border-white/15 backdrop-blur-md">
          <Text className="text-white font-extrabold text-base mb-1 text-center">
            Test Your Wake-up Mission
          </Text>
          <Text className="text-white/70 text-xs mb-3 text-center">
            Try the mission now to understand how it stops the alarm
          </Text>

          {/* Math Mission: 4 MCQ Options with new problem on wrong answer */}
          {mission === 'math' && (
            <View className="items-center mb-2">
              <Text className="text-3xl font-black text-white mb-2 tracking-wider">
                {mathProblem.question}
              </Text>

              {wrongAttempt && !mathSolved && (
                <View className="bg-rose-500/90 px-3 py-1 rounded-full mb-2">
                  <Text className="text-white text-xs font-bold">
                    ❌ Wrong! Here is a new math problem:
                  </Text>
                </View>
              )}

              {mathSolved ? (
                <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                  <Text className="text-white font-black text-sm">
                    ✓ Correct! Alarm Unlocked
                  </Text>
                </View>
              ) : (
                <View className="w-full flex-row flex-wrap justify-between mt-1">
                  {mathProblem.options.map((opt, i) => (
                    <Pressable
                      key={`${opt}-${i}`}
                      onPress={() => handleSelectMathOption(opt)}
                      className="w-[48%] bg-white/20 border border-white/30 py-3 rounded-xl mb-2 items-center active:bg-white/40 shadow-sm"
                    >
                      <Text className="text-white font-black text-lg">
                        {opt}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Shake Mission: Real hardware accelerometer + tap fallback */}
          {mission === 'shake' && (
            <View className="items-center mb-2">
              {shakeCount <= 0 ? (
                <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                  <Text className="text-white font-black text-sm">
                    ✓ Shake Complete! Alarm Unlocked
                  </Text>
                </View>
              ) : (
                <View className="items-center w-full">
                  <Text className="text-white/80 text-xs font-semibold mb-2 text-center">
                    📱 Shake phone physically or tap button below:
                  </Text>
                  <Pressable
                    onPress={() => setShakeCount(prev => Math.max(0, prev - 1))}
                    className="bg-white/25 border border-white/40 px-6 py-3 rounded-xl active:scale-95 items-center w-full"
                  >
                    <Text className="text-white font-black text-base">
                      Shake / Tap ({shakeCount} left) 📱
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Barcode / QR Mission */}
          {mission === 'qr' && (
            <View className="items-center mb-2">
              <Text className="text-white/85 text-xs mb-2 text-center">
                Scan your registered barcode (e.g. bathroom toothpaste) to turn off
              </Text>
              {barcodeScanned ? (
                <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                  <Text className="text-white font-black text-sm">
                    ✓ Barcode Verified! Alarm Unlocked
                  </Text>
                </View>
              ) : (
                <Pressable
                  onPress={() => setBarcodeScanned(true)}
                  className="bg-white/25 border border-white/40 px-6 py-3 rounded-xl active:bg-white/35 items-center w-full"
                >
                  <Text className="text-white font-black text-sm">
                    📷 Tap to Test Scan Barcode
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Final Button */}
          <Pressable
            onPress={handleFinish}
            className="w-full bg-[#FF385C] py-4 rounded-2xl items-center active:opacity-90 shadow-lg mt-3"
          >
            <Text className="text-white text-base font-black tracking-wide">
              Done - Activate Alarmy ✨
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Activated Modal */}
      <CustomConfirmModal
        visible={showActivatedModal}
        title="Alarm Activated! 🎉"
        message={`Your smart alarm is scheduled for ${time} ${period}. Alarmy will wake you up reliably!`}
        icon="🚀"
        confirmText="Let's Go!"
        onConfirm={handleGoHome}
        onCancel={handleGoHome}
      />
    </View>
  );
}


import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { WALLPAPERS } from '@/data/wallpapers';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
import { findAlbaBackground } from '@/data/albaBackgrounds';
import { findMotionMedia } from '@/data/motionMedia';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { formatAlarmyDate, formatTime } from '@/features/alarm/format';
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
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [snoozeToast, setSnoozeToast] = useState(false);

  const { time, period } = formatTime(hour, minute);
  const formattedDate = formatAlarmyDate(new Date());

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
        setShakeCount(prev => {
          const next = Math.max(0, prev - 1);
          if (next === 0) {
            setTimeout(() => {
              setShowMissionModal(false);
              handleFinish();
            }, 600);
          }
          return next;
        });
      });
      return () => unsub();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission]);

  const handleSelectMathOption = (selected: number) => {
    if (selected === mathProblem.answer) {
      setMathSolved(true);
      setWrongAttempt(false);
      setTimeout(() => {
        setShowMissionModal(false);
        handleFinish();
      }, 600);
    } else {
      setWrongAttempt(true);
      // Generate brand new problem on incorrect answer as requested
      setMathProblem(generatePreviewProblem());
    }
  };

  const handleTestBarcode = () => {
    setBarcodeScanned(true);
    setTimeout(() => {
      setShowMissionModal(false);
      handleFinish();
    }, 600);
  };

  const handleSnoozePress = () => {
    setSnoozeToast(true);
    setTimeout(() => setSnoozeToast(false), 2500);
  };

  const handleStartMissionPress = () => {
    if (mission) {
      setShowMissionModal(true);
    } else {
      handleFinish();
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

  const isCustomUri =
    wallpaper?.startsWith('file://') ||
    wallpaper?.startsWith('content://') ||
    wallpaper?.startsWith('http');

  const motionItem = findMotionMedia(wallpaper);
  const albaItem = findAlbaBackground(wallpaper);
  const wallpaperItem = WALLPAPERS.find(w => w.id === wallpaper);
  const bgItem = BACKGROUND_ITEMS.find(b => b.id === wallpaper);
  const thumb = wallpaperThumb(wallpaper);

  const imageSource = isCustomUri
    ? { uri: wallpaper }
    : motionItem
    ? motionItem.poster
    : albaItem
    ? albaItem.source
    : thumb
    ? thumb
    : wallpaperItem?.source ?? bgItem?.source ?? WALLPAPERS[0].source;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

  return (
    <View className="flex-1 relative bg-black">
      <StatusBar barStyle="light-content" />
      {/* 100% Edge-to-Edge Background with physical screen dimensions */}
      <Image
        source={imageSource}
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

      {/* Screen Foreground Content formatted exactly like Alarmy Lock Screen (Image 2) */}
      <View
        className="flex-1 justify-between px-6"
        style={{
          paddingTop: Math.max(insets.top, 24) + 12,
          paddingBottom: Math.max(insets.bottom, 20) + 12,
        }}
      >
        {/* Top Header: Date, Huge Alarmy Clock, and Emoji Label Pill (Image 2 format) */}
        <View className="items-center mt-2">
          {/* Top Date: e.g. November 15 Sun */}
          <Text
            style={styles.dateShadow}
            className="text-white text-base font-bold tracking-wide text-center"
          >
            {formattedDate}
          </Text>

          {/* Huge Alarmy Clock */}
          <Text
            style={styles.clockShadow}
            className="text-white text-[94px] font-black tracking-tight text-center leading-none mt-1 mb-2"
          >
            {time}
          </Text>

          {/* Dark Label Badge Pill */}
          <View className="bg-black/60 px-4 py-1.5 rounded-full flex-row items-center border border-white/10 shadow-md">
            <Text className="text-white font-extrabold text-sm tracking-wide">
              🐥 Wake up early
            </Text>
          </View>

          {/* Discreet Preview Playing indicator */}
          <View className="bg-black/35 px-3 py-1 rounded-full border border-white/10 flex-row items-center mt-3">
            <Text className="text-white/80 text-xs font-semibold">
              🔊 Preview sound playing...
            </Text>
          </View>
        </View>

        {/* Center: Open Wallpaper View with optional Snooze Toast */}
        <View className="flex-1 justify-center items-center">
          {snoozeToast && (
            <View className="bg-black/80 border border-white/20 px-5 py-2.5 rounded-2xl shadow-xl">
              <Text className="text-white text-xs font-bold text-center">
                💤 Snooze will grant 5 extra minutes of rest when ringing!
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Section: Floating Snooze Pill & Coral Action Button */}
        <View className="w-full items-center">
          {/* Snooze Button: ❸ Snooze floating white pill */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSnoozePress}
            className="bg-white px-7 py-2.5 rounded-full flex-row items-center justify-center shadow-2xl mb-4"
          >
            <View className="w-5 h-5 rounded-full bg-black items-center justify-center mr-2">
              <Text className="text-white text-[11px] font-black">3</Text>
            </View>
            <Text className="text-slate-900 font-black text-base tracking-wide">
              Snooze
            </Text>
          </TouchableOpacity>

          {/* Primary Action Button: Alarmy signature Coral Red (#FF2D55) */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartMissionPress}
            className="w-full bg-[#FF2D55] py-4.5 rounded-3xl items-center justify-center shadow-2xl"
          >
            <Text className="text-white text-xl font-black tracking-wider">
              {mission ? 'Start Mission' : 'Dismiss'}
            </Text>
          </TouchableOpacity>

          {/* Direct Activation link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleFinish}
            className="mt-3 py-1"
          >
            <Text className="text-white/80 text-xs font-bold underline">
              Activate Alarm Directly ✨
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Mission Test Modal */}
      <Modal
        visible={showMissionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMissionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/60 px-4 pb-8">
          <View className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-black text-slate-900">
                Test Wake-up Mission 🎯
              </Text>
              <TouchableOpacity
                onPress={() => setShowMissionModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
              >
                <Text className="text-slate-600 font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            <Text className="text-xs text-slate-500 mb-4 font-semibold">
              Complete the test or tap Activate below to finish setup.
            </Text>

            {/* Math Mission MCQ */}
            {mission === 'math' && (
              <View className="items-center mb-3">
                <Text className="text-2xl font-black text-slate-900 mb-3 tracking-wider">
                  {mathProblem.question}
                </Text>

                {wrongAttempt && !mathSolved && (
                  <View className="bg-rose-100 border border-rose-300 px-3 py-1 rounded-full mb-3">
                    <Text className="text-rose-600 text-xs font-bold">
                      ❌ Incorrect! New problem generated:
                    </Text>
                  </View>
                )}

                {mathSolved ? (
                  <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                    <Text className="text-white font-black text-sm">
                      ✓ Correct! Unlocking Alarm...
                    </Text>
                  </View>
                ) : (
                  <View className="w-full flex-row flex-wrap justify-between">
                    {mathProblem.options.map((opt, i) => (
                      <TouchableOpacity
                        key={`${opt}-${i}`}
                        activeOpacity={0.8}
                        onPress={() => handleSelectMathOption(opt)}
                        className="w-[48%] bg-slate-100 border border-slate-300 py-3 rounded-xl mb-2.5 items-center"
                      >
                        <Text className="text-slate-900 font-black text-lg">
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Shake Mission */}
            {mission === 'shake' && (
              <View className="items-center mb-3">
                {shakeCount <= 0 ? (
                  <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                    <Text className="text-white font-black text-sm">
                      ✓ Shake Complete! Unlocking Alarm...
                    </Text>
                  </View>
                ) : (
                  <View className="items-center w-full">
                    <Text className="text-slate-600 text-xs font-semibold mb-2 text-center">
                      📱 Shake your phone physically or tap below:
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        const next = Math.max(0, shakeCount - 1);
                        setShakeCount(next);
                        if (next === 0) {
                          setTimeout(() => {
                            setShowMissionModal(false);
                            handleFinish();
                          }, 600);
                        }
                      }}
                      className="bg-emerald-600 px-6 py-3.5 rounded-xl items-center w-full"
                    >
                      <Text className="text-white font-black text-base">
                        Tap / Shake ({shakeCount} left) 📱
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Barcode Mission */}
            {mission === 'qr' && (
              <View className="items-center mb-3">
                <Text className="text-slate-600 text-xs mb-2 text-center">
                  Scan your registered barcode in the morning to stop the alarm.
                </Text>
                {barcodeScanned ? (
                  <View className="bg-emerald-500 px-5 py-2.5 rounded-xl items-center my-1">
                    <Text className="text-white font-black text-sm">
                      ✓ Barcode Verified!
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleTestBarcode}
                    className="bg-blue-600 px-6 py-3.5 rounded-xl items-center w-full"
                  >
                    <Text className="text-white font-black text-sm">
                      📷 Simulate Scan Barcode
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Bottom Actions inside modal */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setShowMissionModal(false);
                handleFinish();
              }}
              className="w-full bg-[#FF2D55] py-4 rounded-2xl items-center shadow-md mt-2"
            >
              <Text className="text-white text-base font-black tracking-wide">
                Done - Activate Alba ✨
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Activated Modal */}
      <CustomConfirmModal
        visible={showActivatedModal}
        title="Alarm Activated! 🎉"
        message={`Your smart alarm is scheduled for ${time} ${period}. Alba will wake you up reliably!`}
        icon="🚀"
        confirmText="Let's Go!"
        onConfirm={handleGoHome}
        onCancel={handleGoHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dateShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  clockShadow: {
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});


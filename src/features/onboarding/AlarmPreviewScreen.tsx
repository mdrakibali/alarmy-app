import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
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

export function AlarmPreviewScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const { hour, minute, wallpaper, soundId, mission } = route.params;

  const addAlarm = useAlarmStore(s => s.addAlarm);
  const [mathSolved, setMathSolved] = useState(false);
  const [shakeCount, setShakeCount] = useState(10); // mini preview count
  const [showActivatedModal, setShowActivatedModal] = useState(false);

  const { time, period } = formatTime(hour, minute);

  useEffect(() => {
    // Start audio preview simulation
    NativeAlarm.previewSound(soundId);
    return () => {
      NativeAlarm.stopSoundPreview();
    };
  }, [soundId]);

  const handleFinish = () => {
    NativeAlarm.stopSoundPreview();

    // Save alarm to store
    addAlarm({
      hour,
      minute,
      label: 'My First Alarmy',
      repeatDays: [1, 2, 3, 4, 5],
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
  const bottomInset = insets.bottom + 8;

  return (
    <View className="flex-1 justify-between px-6 py-12 relative bg-slate-900">
      {/* Animated GIF Background */}
      <Image
        source={activeBg.source}
        style={[
          StyleSheet.absoluteFill,
          { width: '100%', height: '100%', opacity: 0.85 },
        ]}
        resizeMode="cover"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: '#000000', opacity: 0.35 },
        ]}
        pointerEvents="none"
      />

      {/* Top Banner */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="items-center"
      >
        <View className="bg-black/30 px-4 py-1.5 rounded-full mb-2">
          <Text className="text-white text-xs font-bold tracking-widest uppercase">
            LIVE ALARM PREVIEW 🔔
          </Text>
        </View>
        <Text className="text-white text-sm font-semibold opacity-90 text-center">
          This is exactly how Alarmy will wake you up!
        </Text>
      </View>

      {/* Center Simulated Clock */}
      <View className="items-center justify-center my-6">
        <View className="h-68 w-68 rounded-full bg-white/20 border-4 border-white/40 items-center justify-center p-8 shadow-2xl backdrop-blur-md">
          <Text className="text-6xl font-black text-white tracking-tight">
            {time}
          </Text>
          <Text className="text-2xl font-bold text-white mt-1">{period}</Text>
          <Text className="text-xs font-bold text-white/80 mt-2 bg-black/25 px-3 py-1 rounded-full">
            🔊 Sound Playing...
          </Text>
        </View>
      </View>

      {/* Mission Tryout Section */}
      <View
        style={{ paddingBottom: bottomInset }}
        className="w-full bg-black/40 rounded-3xl p-5 border border-white/10"
      >
        <Text className="text-white font-extrabold text-base mb-1 text-center">
          Test Your Wake-up Mission
        </Text>
        <Text className="text-white/70 text-xs mb-4 text-center">
          Try the mission now to understand how it stops the alarm
        </Text>

        {mission === 'math' && (
          <View className="items-center mb-4">
            <Text className="text-2xl font-bold text-white mb-2">
              17 + 28 = ?
            </Text>
            {mathSolved ? (
              <View className="bg-emerald-500 px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-sm">
                  ✓ Correct! Alarm Unlocked
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setMathSolved(true)}
                className="bg-white/20 border border-white/40 px-6 py-2.5 rounded-xl active:bg-white/30"
              >
                <Text className="text-white font-bold text-sm">
                  Tap to Answer (45)
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {mission === 'shake' && (
          <View className="items-center mb-4">
            {shakeCount <= 0 ? (
              <View className="bg-emerald-500 px-4 py-2 rounded-xl">
                <Text className="text-white font-bold text-sm">
                  ✓ Shake Complete! Alarm Unlocked
                </Text>
              </View>
            ) : (
              <Pressable
                onPress={() => setShakeCount(prev => prev - 1)}
                className="bg-white/20 border border-white/40 px-6 py-2.5 rounded-xl active:scale-95"
              >
                <Text className="text-white font-bold text-sm">
                  Tap to Shake ({shakeCount} left) 📱
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {mission === 'qr' && (
          <View className="items-center mb-4">
            <Text className="text-white/90 text-xs mb-2">
              In real mornings, you will scan a barcode in your bathroom.
            </Text>
            <View className="bg-white/20 border border-white/40 px-5 py-2 rounded-xl">
              <Text className="text-white font-bold text-xs">
                📷 Barcode Scanner Ready
              </Text>
            </View>
          </View>
        )}

        {/* Final Button */}
        <Pressable
          onPress={handleFinish}
          className="w-full bg-[#FF385C] py-4 rounded-2xl items-center active:opacity-90 shadow-lg mt-2"
        >
          <Text className="text-white text-base font-black tracking-wide">
            Done - Activate Alarmy ✨
          </Text>
        </Pressable>
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


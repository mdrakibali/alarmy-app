import React, { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'ShakeMission'>;

export function ShakeMissionScreen({ navigation }: Props) {
  const insets = useAppInsets();
  const REQUIRED_SHAKES = 30;
  const [shakesLeft, setShakesLeft] = useState(REQUIRED_SHAKES);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    // Disable back button during mission
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleShake = async () => {
    setShakesLeft(prev => {
      const next = prev - 1;
      if (next <= 0) {
        completeMission();
        return 0;
      }
      return next;
    });
  };

  const completeMission = async () => {
    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  };

  const progress = ((REQUIRED_SHAKES - shakesLeft) / REQUIRED_SHAKES) * 100;

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
        }}
        className="flex-1 px-6 justify-between items-center"
      >
        {/* Top Header */}
        <View className="items-center mt-2">
          <Text className="text-[#38BDF8] font-extrabold tracking-wider uppercase text-xs">
            Shake Wake-up Mission
          </Text>
          <Text className="text-slate-500 font-semibold text-sm mt-1">
            Shake your phone vigorously!
          </Text>

          <View className="w-64 bg-slate-200 h-2.5 rounded-full mt-4 overflow-hidden">
            <View
              className="bg-[#38BDF8] h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Middle Shake Visual */}
        <View className="items-center justify-center my-8">
          <Pressable
            onPress={handleShake}
            style={{
              elevation: 8,
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 16,
            }}
            className="h-64 w-64 rounded-full bg-white border-4 border-[#38BDF8] items-center justify-center active:scale-95 shadow-lg"
          >
            <Text className="text-6xl font-black text-slate-900">
              {shakesLeft}
            </Text>
            <Text className="text-xs font-black tracking-wider text-[#0284C7] mt-2">
              SHAKES LEFT
            </Text>
            <Text className="text-xs text-slate-400 mt-1">
              Tap or Shake phone
            </Text>
          </Pressable>
        </View>

        {/* Bottom helper */}
        <View className="w-full items-center">
          <Text className="text-slate-500 text-center text-sm font-medium mb-4">
            Physical movement raises your heart rate to wake your body up!
          </Text>
          <Pressable
            onPress={handleShake}
            className="w-full bg-[#38BDF8] py-4 rounded-2xl items-center active:opacity-90 shadow-sm"
          >
            <Text className="text-white font-extrabold text-base tracking-wide">
              Shake! 📱
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Awake and Energized! ⚡"
        message="Shake mission completed! You shook your phone 30 times. Sleep inertia defeated!"
        icon="📱"
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

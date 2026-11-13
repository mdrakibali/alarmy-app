import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'ShakeMission'>;

export function ShakeMissionScreen({ navigation }: Props) {
  const REQUIRED_SHAKES = 30;
  const [shakesLeft, setShakesLeft] = useState(REQUIRED_SHAKES);

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
    Alert.alert('Awake and Energized! ⚡', 'Shake mission completed successfully.', [
      {
        text: 'Awesome!',
        onPress: () =>
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
      },
    ]);
  };

  const progress = ((REQUIRED_SHAKES - shakesLeft) / REQUIRED_SHAKES) * 100;

  return (
    <View className="flex-1 bg-slate-950 px-6 py-12 justify-between items-center">
      {/* Top Header */}
      <View className="items-center mt-4">
        <Text className="text-amber-400 font-bold tracking-wider uppercase text-xs">
          Shake Wake-up Mission
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Shake your phone vigorously!
        </Text>

        <View className="w-64 bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
          <View
            className="bg-amber-500 h-full rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>

      {/* Middle Shake Visual */}
      <View className="items-center justify-center my-8">
        <Pressable
          onPress={handleShake}
          className="h-60 w-60 rounded-full bg-slate-900 border-4 border-amber-500 items-center justify-center active:scale-95 shadow-2xl"
        >
          <Text className="text-6xl font-extrabold text-white">
            {shakesLeft}
          </Text>
          <Text className="text-sm font-semibold text-amber-400 mt-2">
            SHAKES LEFT
          </Text>
          <Text className="text-xs text-slate-500 mt-1">Tap or Shake phone</Text>
        </Pressable>
      </View>

      {/* Bottom helper */}
      <View className="w-full items-center">
        <Text className="text-slate-400 text-center text-sm mb-4">
          Physical movement raises your heart rate to wake your brain up!
        </Text>
        <Pressable
          onPress={handleShake}
          className="w-full bg-amber-500 py-4 rounded-2xl items-center active:opacity-90"
        >
          <Text className="text-slate-950 font-bold text-lg">Shake! 📱</Text>
        </Pressable>
      </View>
    </View>
  );
}


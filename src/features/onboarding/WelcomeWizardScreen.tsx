import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import type { MissionType } from '../alarm/types';

import { WALLPAPERS } from '@/data/wallpapers';
import { ALARM_SOUND_ITEMS } from '@/data/alarmSounds';

type Props = NativeStackScreenProps<RootStackParamList, 'WelcomeWizard'>;

const MISSIONS: { id: MissionType; title: string; desc: string; icon: string }[] = [
  {
    id: 'math',
    title: 'Math Mission',
    desc: 'Solve simple math equations to turn off the alarm. Shuts off sleep inertia!',
    icon: '🧠',
  },
  {
    id: 'shake',
    title: 'Shake Mission',
    desc: 'Shake your phone 30 times vigorously to pump adrenaline and wake up!',
    icon: '📱',
  },
  {
    id: 'qr',
    title: 'QR / Barcode Mission',
    desc: 'Leave bed and scan your bathroom toothpaste or coffee mug to turn off!',
    icon: '📷',
  },
];

export function WelcomeWizardScreen({ navigation }: Props) {
  const insets = useAppInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard state
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedWallpaper, setSelectedWallpaper] = useState('kpop_wonhee');
  const [selectedSound, setSelectedSound] = useState('alarm_gentle_morning');
  const [selectedMission, setSelectedMission] = useState<MissionType>('shake');

  // Stop audio preview on unmount
  useEffect(() => {
    return () => {
      NativeAlarm.stopSoundPreview();
    };
  }, []);

  const handleSoundSelect = async (soundId: string) => {
    setSelectedSound(soundId);
    await NativeAlarm.previewSound(soundId);
  };

  const handleNext = () => {
    NativeAlarm.stopSoundPreview();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else {
      // Go to Preview Screen!
      navigation.navigate('AlarmPreview', {
        hour: selectedHour,
        minute: selectedMinute,
        wallpaper: selectedWallpaper,
        soundId: selectedSound,
        mission: selectedMission,
      });
    }
  };

  const bottomInset = insets.bottom + 8;

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Header with Progress Bar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 bg-white border-b border-slate-100 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center flex-1 mr-4">
            <View className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-[#FF385C] rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </View>
          </View>
          <Text className="text-slate-400 font-bold text-xs">{step}/4</Text>
        </View>

        {/* Step Title */}
        <Text className="text-2xl font-black text-slate-900 mt-1 text-center">
          {step === 1 && 'Set your alarm time'}
          {step === 2 && 'Choose your alarm wallpaper'}
          {step === 3 && 'Choose your alarm sound'}
          {step === 4 && 'Choose your wake-up mission'}
        </Text>
      </View>

      {/* Step Content */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: TIME PICKER */}
        {step === 1 && (
          <View className="items-center justify-center py-6">
            <Text className="text-slate-500 text-sm font-medium mb-5 text-center">
              Scroll or tap to choose when you want to wake up
            </Text>
            <View className="bg-white border border-slate-100 rounded-3xl p-6 w-full items-center shadow-sm">
              <WheelTimePicker
                hour={selectedHour}
                minute={selectedMinute}
                onChange={(h, m) => {
                  setSelectedHour(h);
                  setSelectedMinute(m);
                }}
              />
            </View>
          </View>
        )}

        {/* STEP 2: WALLPAPERS */}
        {step === 2 && (
          <View className="py-2">
            {['KPOP Trending', 'Trending', 'Daily Motivation'].map(category => (
              <View key={category} className="mb-6">
                <Text className="text-slate-800 font-bold text-sm mb-3">
                  {category === 'KPOP Trending' && '🔮 KPOP Trending'}
                  {category === 'Trending' && '💖 Trending'}
                  {category === 'Daily Motivation' && '🔥 Daily Motivation'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {WALLPAPERS.filter(w => w.category === category).map(w => {
                    const isSelected = selectedWallpaper === w.id;
                    return (
                      <Pressable
                        key={w.id}
                        onPress={() => setSelectedWallpaper(w.id)}
                        className={`mr-3 h-48 w-32 rounded-3xl overflow-hidden justify-between items-center border-2 relative ${
                          isSelected
                            ? 'border-[#FF385C] scale-102 shadow-md'
                            : 'border-slate-200 bg-white'
                        }`}
                        style={{ backgroundColor: '#F8FAFC' }}
                      >
                        <Image
                          source={w.source}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            width: '100%',
                            height: '100%',
                          }}
                          resizeMode="cover"
                        />
                        <View className="items-center justify-center flex-1" />
                        <View className="w-full items-center py-2 px-1 bg-black/60 backdrop-blur-sm">
                          <Text
                            className={`text-xs font-black ${
                              isSelected ? 'text-[#FF385C]' : 'text-white'
                            }`}
                            numberOfLines={1}
                          >
                            ♪ {w.title}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ))}
          </View>
        )}

        {/* STEP 3: SOUNDS */}
        {step === 3 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Tap any sound to hear the audio preview immediately
            </Text>

            {ALARM_SOUND_ITEMS.slice(0, 12).map(s => {
              const isSelected = selectedSound === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => handleSoundSelect(s.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border shadow-xs ${
                    isSelected
                      ? 'bg-rose-50/70 border-[#FF385C]'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <Text className="text-2xl mr-3">{s.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-[#FF385C]' : 'text-slate-800'
                        }`}
                      >
                        {s.title}
                      </Text>
                      <Text className="text-xs text-slate-400 font-medium mt-0.5">
                        {s.category}
                      </Text>
                    </View>
                  </View>

                  {/* Radio circle */}
                  <View
                    className={`h-6 w-6 rounded-full items-center justify-center border-2 ${
                      isSelected
                        ? 'border-[#FF385C] bg-[#FF385C]'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <View className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* STEP 4: MISSIONS */}
        {step === 4 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Alarmy ensures you never oversleep by requiring a wake-up mission
            </Text>

            {MISSIONS.map(m => {
              const isSelected = selectedMission === m.id;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => setSelectedMission(m.id)}
                  className={`p-5 rounded-3xl mb-4 border-2 shadow-xs ${
                    isSelected
                      ? 'bg-rose-50/70 border-[#FF385C]'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center">
                      <Text className="text-3xl mr-3">{m.icon}</Text>
                      <Text className="text-lg font-black text-slate-900">
                        {m.title}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 rounded-full items-center justify-center border-2 ${
                        isSelected
                          ? 'border-[#FF385C] bg-[#FF385C]'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && (
                        <View className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </View>
                  </View>
                  <Text className="text-xs text-slate-500 font-medium leading-relaxed pl-10">
                    {m.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom Button with Safe Area */}
      <View
        style={{
          paddingBottom: bottomInset,
          paddingHorizontal: 20,
          paddingTop: 12,
          elevation: 10,
          zIndex: 100,
        }}
        className="bg-white border-t border-slate-100 shadow-sm"
      >
        <Pressable
          onPress={handleNext}
          className="w-full bg-[#FF385C] py-4 rounded-2xl items-center active:opacity-90 shadow-md"
        >
          <Text className="text-white text-base font-black tracking-wide">
            {step === 4 ? 'Preview Alarm 🚀' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}


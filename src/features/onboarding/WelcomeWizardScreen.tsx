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
import { useThemeStore } from '@/storage/themeStore';

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
  {
    id: 'typing',
    title: 'Typing Mission',
    desc: 'Type motivational morning affirmations accurately to start your day!',
    icon: '⌨️',
  },
];

// Curated top 6 wallpapers for fast, 60fps rendering without memory overload
const CURATED_WALLPAPER_IDS = [
  'kpop_wonhee',
  'anime_girl_lofi',
  'aesthetic_neon_sunset',
  'animals_happy_puppy',
  'galaxy_aurora_borealis',
  'kpop_illit_dance',
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
      NativeAlarm.stopSoundPreview().catch(() => {});
    };
  }, []);

  const handleSoundSelect = (soundId: string) => {
    setSelectedSound(soundId);
    NativeAlarm.previewSound(soundId).catch(() => {});
  };

  const handleNext = () => {
    NativeAlarm.stopSoundPreview().catch(() => {});
    if (step < 4) {
      setStep(prev => ((prev + 1) as 1 | 2 | 3 | 4));
    } else {
      // Step 4 complete: Navigate to Permission Screen as requested!
      navigation.navigate('Permission', {
        hour: selectedHour,
        minute: selectedMinute,
        wallpaper: selectedWallpaper,
        soundId: selectedSound,
        mission: selectedMission,
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => ((prev - 1) as 1 | 2 | 3 | 4));
    }
  };

  const curatedWallpapers = CURATED_WALLPAPER_IDS.map(
    id => WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0],
  );

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Header with Progress Bar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 bg-white border-b border-slate-100 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-3">
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              hitSlop={10}
              className="mr-3 py-1.5 px-3 rounded-full bg-slate-100 active:bg-slate-200"
            >
              <Text className="text-slate-700 font-extrabold text-xs">‹ Back</Text>
            </Pressable>
          ) : null}
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
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: TIME PICKER */}
        {step === 1 && (
          <View className="items-center justify-center py-2">
            <Text className="text-slate-500 text-sm font-medium mb-3 text-center">
              Scroll or tap to choose when you want to wake up
            </Text>
            <View className="bg-white border border-slate-100 rounded-3xl p-4 w-full items-center shadow-sm">
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

        {/* STEP 2: WALLPAPERS (Fast 60fps Grid with Instant Selection) */}
        {step === 2 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Tap any animated wallpaper to select your morning vibe
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {curatedWallpapers.map(w => {
                const isSelected = selectedWallpaper === w.id;
                return (
                  <Pressable
                    key={w.id}
                    hitSlop={8}
                    onPress={() => {
                      setSelectedWallpaper(w.id);
                      useThemeStore.getState().setBackground('alarm', w.id);
                    }}
                    className={`w-[48%] h-52 mb-4 rounded-3xl overflow-hidden justify-between items-center relative border-2 ${
                      isSelected
                        ? 'border-[#FF385C] shadow-lg scale-102'
                        : 'border-slate-200 bg-white shadow-xs active:scale-98'
                    }`}
                  >
                    {/* Animated GIF Background */}
                    <Image
                      source={w.source}
                      className="absolute inset-0 w-full h-full"
                      resizeMode="cover"
                    />

                    {/* Top Right Check Badge */}
                    <View className="w-full flex-row justify-end p-2.5 z-10">
                      {isSelected ? (
                        <View className="h-7 w-7 rounded-full bg-[#FF385C] border-2 border-white items-center justify-center shadow-md">
                          <Text className="text-white text-xs font-black">✓</Text>
                        </View>
                      ) : (
                        <View className="h-6 w-6 rounded-full bg-black/40 border border-white/60 items-center justify-center">
                          <Text className="text-white/60 text-[10px]">○</Text>
                        </View>
                      )}
                    </View>

                    {/* Bottom Title Bar */}
                    <View className="w-full items-center py-2 px-1.5 bg-black/75 z-10 border-t border-white/10">
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-[#FF385C]' : 'text-white'
                        }`}
                        numberOfLines={1}
                      >
                        ♪ {w.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* STEP 3: SOUNDS */}
        {step === 3 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Tap any sound to hear the audio preview immediately
            </Text>

            {ALARM_SOUND_ITEMS.slice(0, 10).map(s => {
              const isSelected = selectedSound === s.id;
              return (
                <Pressable
                  key={s.id}
                  hitSlop={8}
                  onPress={() => handleSoundSelect(s.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border shadow-xs ${
                    isSelected
                      ? 'bg-rose-50/70 border-[#FF385C]'
                      : 'bg-white border-slate-100 active:bg-slate-50'
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
                  hitSlop={8}
                  onPress={() => setSelectedMission(m.id)}
                  className={`p-5 rounded-3xl mb-4 border-2 shadow-xs ${
                    isSelected
                      ? 'bg-rose-50/70 border-[#FF385C]'
                      : 'bg-white border-slate-100 active:bg-slate-50'
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
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
        className="bg-white border-t border-slate-100 shadow-md px-5 pt-3 z-50"
      >
        <Pressable
          onPress={handleNext}
          hitSlop={15}
          className="w-full bg-[#FF385C] py-4 rounded-2xl items-center shadow-md active:bg-[#E03150]"
        >
          <Text className="text-white text-base font-black tracking-wide">
            {step === 4 ? 'Next: Required Permissions 🔐' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

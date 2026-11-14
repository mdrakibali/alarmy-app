import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import type { MissionType } from '../alarm/types';
import { WALLPAPERS } from '@/data/wallpapers';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
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
  {
    id: 'photo',
    title: 'Photo Mission',
    desc: 'Leave bed and photograph a registered object (like your bathroom sink)!',
    icon: '📸',
  },
  {
    id: 'squat',
    title: 'Squat Mission',
    desc: 'Do 10 morning squats holding your phone to activate your blood flow!',
    icon: '🏋️',
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

interface WallpaperCardProps {
  id: string;
  name: string;
  source: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const MemoizedWallpaperCard = React.memo(function WallpaperCardComponent({
  id,
  name,
  source,
  isSelected,
  onSelect,
}: WallpaperCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onSelect(id)}
      className={`w-[48%] h-52 mb-4 rounded-3xl overflow-hidden justify-between items-center relative border-2 ${
        isSelected
          ? 'border-[#4E7D5B] shadow-md bg-[#EBF3ED]/30'
          : 'border-slate-200 bg-white shadow-xs'
      }`}
    >
      {/* Animated GIF Background */}
      <Image
        source={source}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* Top Right Check Badge */}
      <View className="w-full flex-row justify-end p-2.5 z-10">
        {isSelected ? (
          <View className="h-7 w-7 rounded-full bg-[#4E7D5B] border-2 border-white items-center justify-center shadow-md">
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
            isSelected ? 'text-[#E2A938]' : 'text-white'
          }`}
          numberOfLines={1}
        >
          ♪ {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

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

  const handleWallpaperSelect = useCallback((id: string) => {
    setSelectedWallpaper(id);
  }, []);

  const handleNext = () => {
    NativeAlarm.stopSoundPreview().catch(() => {});
    if (step === 2) {
      // Commit chosen wallpaper to theme store only when advancing past step 2
      useThemeStore.getState().setBackground('alarm', selectedWallpaper);
    }
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

  const curatedWallpapers = useMemo(() => {
    return CURATED_WALLPAPER_IDS.map(
      id => WALLPAPERS.find(w => w.id === id) || WALLPAPERS[0],
    );
  }, []);

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Header with Progress Bar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 bg-white border-b border-slate-100 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-3">
          {step > 1 ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleBack}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="mr-3 py-1.5 px-3 rounded-full bg-slate-100"
            >
              <Text className="text-slate-700 font-extrabold text-xs">‹ Back</Text>
            </TouchableOpacity>
          ) : null}
          <View className="flex-row items-center flex-1 mr-4">
            <View className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-[#4E7D5B] rounded-full"
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

        {/* STEP 2: WALLPAPERS (Memoized 60fps Grid with Zero Transform Locks) */}
        {step === 2 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Tap any animated wallpaper to select your morning vibe
            </Text>

            <View className="flex-row flex-wrap justify-between">
              {curatedWallpapers.map(w => (
                <MemoizedWallpaperCard
                  key={w.id}
                  id={w.id}
                  name={w.name}
                  source={wallpaperThumb(w.id) ?? w.source}
                  isSelected={selectedWallpaper === w.id}
                  onSelect={handleWallpaperSelect}
                />
              ))}
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
                <TouchableOpacity
                  key={s.id}
                  activeOpacity={0.8}
                  onPress={() => handleSoundSelect(s.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border shadow-xs ${
                    isSelected
                      ? 'bg-[#EBF3ED] border-[#6B8F71]/40'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <Text className="text-2xl mr-3">{s.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-[#4E7D5B]' : 'text-slate-800'
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
                        ? 'border-[#4E7D5B] bg-[#4E7D5B]'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <View className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 4: MISSIONS */}
        {step === 4 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              Alba ensures you never oversleep by requiring a wake-up mission
            </Text>

            {MISSIONS.map(m => {
              const isSelected = selectedMission === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedMission(m.id)}
                  className={`p-5 rounded-3xl mb-4 border-2 shadow-xs ${
                    isSelected
                      ? 'bg-[#EBF3ED] border-[#4E7D5B]'
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
                          ? 'border-[#4E7D5B] bg-[#4E7D5B]'
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
                </TouchableOpacity>
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
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          className="w-full bg-[#4E7D5B] py-4 rounded-2xl items-center shadow-md"
        >
          <Text className="text-white text-base font-black tracking-wide">
            {step === 4 ? 'Next: Required Permissions 🔐' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
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
import { MOTION_MEDIA, type MotionItem } from '@/data/motionMedia';
import { ALARM_SOUND_ITEMS } from '@/data/alarmSounds';
import { useThemeStore } from '@/storage/themeStore';
import { formatTime } from '../alarm/format';

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

interface WallpaperCardProps {
  item: MotionItem;
  isSelected: boolean;
  onSelect: (item: MotionItem) => void;
}

const WallpaperCard = React.memo(
  function WallpaperCardComponent({
    item,
    isSelected,
    onSelect,
  }: WallpaperCardProps) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => onSelect(item)}
        style={{
          borderColor: isSelected ? '#1652E6' : '#E2E8F0',
          borderWidth: 2,
        }}
        className="w-[48%] h-52 mb-4 rounded-3xl overflow-hidden justify-between items-center relative bg-white shadow-xs"
      >
        <Image
          pointerEvents="none"
          source={item.poster}
          fadeDuration={0}
          resizeMethod="resize"
          resizeMode="cover"
          className="absolute inset-0 w-full h-full"
        />

        {/* Top Right Check / Preview Badge */}
        <View pointerEvents="none" className="w-full flex-row justify-between p-2.5 z-10">
          <View className="px-2 py-0.5 rounded-full bg-black/60">
            <Text className="text-white text-[9px] font-black uppercase">
              {item.kind}
            </Text>
          </View>
          {isSelected ? (
            <View className="h-6 w-6 rounded-full bg-primary border-2 border-white items-center justify-center">
              <Text className="text-white text-xs font-black">✓</Text>
            </View>
          ) : (
            <View className="h-6 w-6 rounded-full bg-black/40 border border-white/60 items-center justify-center">
              <Text className="text-white/80 text-[10px]">👁️</Text>
            </View>
          )}
        </View>

        {/* Name footer */}
        <View pointerEvents="none" className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
          <Text className="text-white text-xs font-bold text-center" numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected && prev.item.id === next.item.id,
);

export function WelcomeWizardScreen({ navigation }: Props) {
  const insets = useAppInsets();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard state
  const [selectedHour, setSelectedHour] = useState(7);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedWallpaper, setSelectedWallpaper] = useState(MOTION_MEDIA[0].id);
  const [previewWallpaper, setPreviewWallpaper] = useState<MotionItem | null>(null);
  const [selectedSound, setSelectedSound] = useState('alarm_gentle_morning');
  const [selectedMissions, setSelectedMissions] = useState<MissionType[]>(['shake']);

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
  
  const handleWallpaperSelect = useCallback((item: MotionItem) => {
    setSelectedWallpaper(item.id);
    setPreviewWallpaper(item);
  }, []);

  const handleConfirmPreview = () => {
    if (previewWallpaper) {
      useThemeStore.getState().setBackground('alarm', previewWallpaper.id);
      useThemeStore.getState().setBackground('ringing', previewWallpaper.id);
      setSelectedWallpaper(previewWallpaper.id);
    }
    setPreviewWallpaper(null);
    setStep(3); // Advance directly to Step 3 (Sound selector) matching Alarmy 1.7 -> 1.8
  };

  const handleToggleMission = (id: MissionType) => {
    setSelectedMissions(curr => {
      if (curr.includes(id)) {
        if (curr.length === 1) return curr; // Keep at least one
        return curr.filter(m => m !== id);
      }
      if (curr.length >= 5) return curr; // Maximum 5 chained missions
      return [...curr, id];
    });
  };

  const handleNext = () => {
    NativeAlarm.stopSoundPreview().catch(() => {});
    if (step === 2) {
      useThemeStore.getState().setBackground('alarm', selectedWallpaper);
      useThemeStore.getState().setBackground('ringing', selectedWallpaper);
    }
    if (step < 4) {
      setStep(prev => ((prev + 1) as 1 | 2 | 3 | 4));
    } else {
      // Step 4 complete: Navigate to Permission Screen
      navigation.navigate('Permission', {
        hour: selectedHour,
        minute: selectedMinute,
        wallpaper: selectedWallpaper,
        soundId: selectedSound,
        mission: selectedMissions[0],
        missions: selectedMissions,
      } as any);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => ((prev - 1) as 1 | 2 | 3 | 4));
    }
  };

  const wallpaperChoices = useMemo(() => MOTION_MEDIA, []);

  const renderWallpaperItem = useCallback(
    ({ item }: { item: MotionItem }) => (
      <WallpaperCard
        item={item}
        isSelected={selectedWallpaper === item.id}
        onSelect={handleWallpaperSelect}
      />
    ),
    [selectedWallpaper, handleWallpaperSelect],
  );

  const { time: previewTime } = formatTime(selectedHour, selectedMinute);

  return (
    <View className="flex-1 bg-background">
      {/* Header with Progress Bar */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 bg-white border-b border-slate-100 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-3">
          {step > 1 ? (
            <Pressable
              onPress={handleBack}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="mr-3 py-1.5 px-3 rounded-full bg-slate-100"
            >
              <Text className="text-slate-700 font-extrabold text-xs">‹ Back</Text>
            </Pressable>
          ) : null}
          <View className="flex-row items-center flex-1 mr-4">
            <View className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
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

      {/* Step Content: Step 2 uses FlatList for high performance & virtualization */}
      {step === 2 ? (
        <FlatList<MotionItem>
          data={wallpaperChoices}
          extraData={selectedWallpaper}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 24,
          }}
          getItemLayout={(_, index) => ({
            length: 224,
            offset: 224 * Math.floor(index / 2),
            index,
          })}
          ListHeaderComponent={
            <Text className="text-slate-500 text-xs font-semibold mb-4 text-center">
              GIF and MP4 posters. Tap any wallpaper to choose.
            </Text>
          }
          renderItem={renderWallpaperItem}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={3}
          removeClippedSubviews={Platform.OS === 'android'}
          showsVerticalScrollIndicator={false}
        />
      ) : (
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
                  onPress={() => handleSoundSelect(s.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-3 border shadow-xs ${
                    isSelected
                      ? 'bg-ice border-primary/30'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <View pointerEvents="none" className="flex-row items-center flex-1 pr-3">
                    <Text className="text-2xl mr-3">{s.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-primary' : 'text-slate-800'
                        }`}
                      >
                        {s.title}
                      </Text>
                      <Text className="text-xs text-slate-400 font-medium mt-0.5">
                        {s.category}
                      </Text>
                    </View>
                  </View>

                  <View
                    pointerEvents="none"
                    className={`h-6 w-6 rounded-full items-center justify-center border-2 ${
                      isSelected
                        ? 'border-primary bg-primary'
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

        {/* STEP 4: MISSIONS (Multiple Chained Missions) */}
        {step === 4 && (
          <View className="py-2">
            <Text className="text-slate-500 text-xs font-semibold mb-2 text-center">
              Select 1 to 5 wake-up missions to build your sequence ({selectedMissions.length}/5 selected)
            </Text>

            {MISSIONS.map(m => {
              const missionIndex = selectedMissions.indexOf(m.id);
              const isSelected = missionIndex !== -1;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => handleToggleMission(m.id)}
                  className={`p-5 rounded-3xl mb-3 border-2 shadow-xs ${
                    isSelected
                      ? 'bg-ice border-primary'
                      : 'bg-white border-slate-100'
                  }`}
                >
                  <View pointerEvents="none" className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center flex-1 pr-2">
                      <Text className="text-3xl mr-3">{m.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-black text-slate-900">
                          {m.title}
                        </Text>
                        <Text className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                          {m.desc}
                        </Text>
                      </View>
                    </View>
                    <View
                      className={`h-7 px-2.5 rounded-full items-center justify-center border-2 ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-slate-300 bg-transparent'
                      }`}
                    >
                      {isSelected ? (
                        <Text className="text-white text-xs font-black">
                          {missionIndex + 1}
                        </Text>
                      ) : (
                        <Text className="text-slate-400 text-xs font-black">+</Text>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
      )}

      {/* Full-Screen Wallpaper Preview Modal (Alarmy 1.7 Flow) */}
      <Modal
        visible={previewWallpaper !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={() => setPreviewWallpaper(null)}
      >
        {previewWallpaper && (
          <View className="flex-1 bg-black">
            <Image
              source={previewWallpaper.poster}
              className="absolute inset-0 w-full h-full"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/25" pointerEvents="none" />

            {/* Top Bar with Back Chevron */}
            <View
              style={{ paddingTop: Math.max(insets.top, 16) }}
              className="px-5 flex-row items-center justify-between z-20"
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setPreviewWallpaper(null)}
                className="h-10 w-10 rounded-full bg-black/40 items-center justify-center border border-white/20"
              >
                <Text className="text-white text-lg font-black">‹</Text>
              </TouchableOpacity>
              <View className="px-3 py-1 rounded-full bg-black/40 border border-white/20">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  {previewWallpaper.name}
                </Text>
              </View>
              <View className="w-10" />
            </View>

            {/* Alarmy-Style Live Clock and Date (1.7 Background Preview) */}
            <View className="items-center mt-12 z-10 px-4">
              <Text className="text-white/80 font-bold text-sm tracking-wide">
                {new Date().toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  weekday: 'short',
                })}
              </Text>
              <Text
                style={{
                  textShadowColor: 'rgba(0, 0, 0, 0.45)',
                  textShadowOffset: { width: 0, height: 2 },
                  textShadowRadius: 8,
                }}
                className="text-white font-black text-7xl mt-1 tracking-tight"
              >
                {previewTime}
              </Text>
            </View>

            <View className="flex-1" />

            {/* Bottom Audio Indicator & Next Button */}
            <View style={{ paddingBottom: insets.bottom + 20 }} className="px-5 z-20">
              <View className="items-center mb-4">
                <View className="flex-row items-center bg-black/50 border border-white/20 rounded-full px-4 py-1.5">
                  <Text className="text-white text-xs mr-2">ılıl</Text>
                  <Text className="text-white text-xs font-semibold">
                    Alarm rings with video sound
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirmPreview}
                className="w-full bg-primary py-4 rounded-2xl items-center shadow-lg active:bg-primary-dark"
              >
                <Text className="text-white text-base font-black tracking-wide">
                  Next
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Bottom Button with Safe Area */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
        className="bg-white border-t border-slate-100 shadow-md px-5 pt-3 z-50"
      >
        <Pressable
          onPress={handleNext}
          className="w-full bg-primary py-4 rounded-2xl items-center shadow-md active:bg-primary-dark"
        >
          <Text className="text-white text-base font-black tracking-wide">
            {step === 4 ? 'Next: Required Permissions 🔐' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

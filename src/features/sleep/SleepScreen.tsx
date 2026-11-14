import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Screen } from '@/components/ui/Screen';
import {
  SLEEP_MUSIC_ITEMS,
  SleepMusicCategory,
} from '@/data/sleepMusic';
import { NativeAlarm } from '@/native/AlarmModule';
import { useAppInsets } from '@/utils/safeArea';

const CATEGORIES: SleepMusicCategory[] = [
  'All',
  'Nature',
  'Noise',
  'Meditation',
  'Ambient',
  'Music',
];

const TIMER_OPTIONS = [
  { label: 'Off', minutes: 0 },
  { label: '15m', minutes: 15 },
  { label: '30m', minutes: 30 },
  { label: '60m', minutes: 60 },
];

export function SleepScreen() {
  const insets = useAppInsets();
  const [selectedCategory, setSelectedCategory] =
    useState<SleepMusicCategory>('All');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);

  // Poll native sleep player status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await NativeAlarm.getSleepMusicStatus();
      if (status) {
        setIsPlaying(status.isPlaying);
        setCurrentPlayingId(status.currentSoundId);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return SLEEP_MUSIC_ITEMS;
    return SLEEP_MUSIC_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const togglePlay = (soundId: string) => {
    if (currentPlayingId === soundId && isPlaying) {
      NativeAlarm.stopSleepMusic().catch(() => {});
      setIsPlaying(false);
      setCurrentPlayingId(null);
    } else {
      setCurrentPlayingId(soundId);
      setIsPlaying(true);
      NativeAlarm.playSleepMusic(
        soundId,
        volume,
        true,
        timerMinutes,
      ).catch(() => {});
    }
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    NativeAlarm.setSleepMusicVolume(vol).catch(() => {});
  };

  const handleTimerChange = (mins: number) => {
    setTimerMinutes(mins);
    if (isPlaying && currentPlayingId) {
      NativeAlarm.playSleepMusic(currentPlayingId, volume, true, mins).catch(() => {});
    }
  };

  return (
    <Screen padded={false}>
      <View className="flex-1 bg-[#F5F6F8]">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 80 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-slate-900 tracking-tight">
                Sleep & Relax
              </Text>
              <Text className="text-xs font-semibold text-slate-500 mt-1">
                Calming sounds to help you fall asleep peacefully
              </Text>
            </View>
            <View className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-lg">🌙</Text>
            </View>
          </View>

          {/* Player Quick Controls (Volume & Timer right on the screen) */}
          <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 mt-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sleep Timer
              </Text>
              <View className="flex-row">
                {TIMER_OPTIONS.map(opt => (
                  <Pressable
                    key={opt.minutes}
                    onPress={() => handleTimerChange(opt.minutes)}
                    className={`px-2.5 py-1 rounded-lg ml-1.5 border ${
                      timerMinutes === opt.minutes
                        ? 'bg-[#0284C7] border-[#0284C7]'
                        : 'bg-slate-100 border-slate-100'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        timerMinutes === opt.minutes ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Volume
              </Text>
              <View className="flex-row">
                {[0.4, 0.7, 1.0].map((vol, i) => (
                  <Pressable
                    key={vol}
                    onPress={() => handleVolumeChange(vol)}
                    className={`px-3 py-1 rounded-lg ml-1.5 border ${
                      volume === vol
                        ? 'bg-[#0284C7] border-[#0284C7]'
                        : 'bg-slate-100 border-slate-100'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        volume === vol ? 'text-white' : 'text-slate-600'
                      }`}
                    >
                      {i === 0 ? 'Low' : i === 1 ? 'Med' : 'Max'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4 -mx-1"
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {CATEGORIES.map(cat => (
              <Pressable
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                className={`mr-2 px-4 py-2 rounded-2xl border ${
                  selectedCategory === cat
                    ? 'bg-[#0F172A] border-[#0F172A]'
                    : 'bg-white border-slate-200/80 active:bg-slate-50'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === cat ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {cat}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Sleep Music List - Each card has its own Play/Stop toggle directly on the item */}
          <View className="mt-4">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-base font-extrabold text-slate-900">
                Sounds & Melodies
              </Text>
              <Text className="text-xs font-bold text-slate-400">
                {filteredItems.length} sounds
              </Text>
            </View>

            {filteredItems.map(sound => {
              const isThisPlaying = currentPlayingId === sound.id && isPlaying;
              return (
                <View
                  key={sound.id}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                    isThisPlaying
                      ? 'bg-[#E0F2FE] border-[#38BDF8] shadow-sm'
                      : 'bg-white border-slate-100 shadow-xs'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="h-12 w-12 rounded-2xl bg-slate-100 items-center justify-center mr-3">
                      <Text className="text-2xl">{sound.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-0.5">
                        <Text
                          className={`text-sm font-extrabold ${
                            isThisPlaying ? 'text-[#0284C7]' : 'text-slate-900'
                          }`}
                        >
                          {sound.title}
                        </Text>
                        <View className="ml-2 rounded bg-slate-100 px-1.5 py-0.5">
                          <Text className="text-[9px] font-bold text-slate-500">
                            {sound.category}
                          </Text>
                        </View>
                      </View>
                      <Text
                        className="text-xs text-slate-500 font-medium leading-tight"
                        numberOfLines={1}
                      >
                        {sound.description}
                      </Text>
                    </View>
                  </View>

                  {/* Direct Play / Stop Button on the Card */}
                  <Pressable
                    onPress={() => togglePlay(sound.id)}
                    hitSlop={8}
                    className={`px-3.5 py-2 rounded-xl flex-row items-center shadow-xs ${
                      isThisPlaying
                        ? 'bg-rose-500 active:bg-rose-600'
                        : 'bg-[#0284C7] active:bg-[#0369A1]'
                    }`}
                  >
                    <Text className="text-white text-xs font-black mr-1">
                      {isThisPlaying ? '■' : '▶'}
                    </Text>
                    <Text className="text-white text-xs font-black">
                      {isThisPlaying ? 'Stop' : 'Play'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Bedtime Checklist */}
          <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mt-4">
            <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              BEDTIME ROUTINE
            </Text>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-base mr-2.5">📵</Text>
              <Text className="text-xs font-semibold text-slate-700 flex-1">
                Put smartphone away 30 minutes before sleep
              </Text>
            </View>
            <View className="flex-row items-center mb-2.5">
              <Text className="text-base mr-2.5">💧</Text>
              <Text className="text-xs font-semibold text-slate-700 flex-1">
                Drink a glass of warm water
              </Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-base mr-2.5">🌬️</Text>
              <Text className="text-xs font-semibold text-slate-700 flex-1">
                Take 5 deep breaths in a dark, quiet room
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
}

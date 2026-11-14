import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
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
  { label: '45m', minutes: 45 },
  { label: '60m', minutes: 60 },
  { label: '90m', minutes: 90 },
];

export function SleepScreen() {
  const insets = useAppInsets();
  const [selectedCategory, setSelectedCategory] =
    useState<SleepMusicCategory>('All');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const [remainingSecs, setRemainingSecs] = useState<number>(0);
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // Poll native sleep player status periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      const status = await NativeAlarm.getSleepMusicStatus();
      if (status) {
        setIsPlaying(status.isPlaying);
        setCurrentPlayingId(status.currentSoundId);
        setRemainingSecs(status.remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return SLEEP_MUSIC_ITEMS;
    return SLEEP_MUSIC_ITEMS.filter(item => item.category === selectedCategory);
  }, [selectedCategory]);

  const activeItem = useMemo(() => {
    return SLEEP_MUSIC_ITEMS.find(s => s.id === currentPlayingId);
  }, [currentPlayingId]);

  const togglePlay = async (soundId: string) => {
    if (currentPlayingId === soundId && isPlaying) {
      await NativeAlarm.stopSleepMusic();
      setIsPlaying(false);
      setCurrentPlayingId(null);
    } else {
      const success = await NativeAlarm.playSleepMusic(
        soundId,
        volume,
        true,
        timerMinutes,
      );
      if (success) {
        setCurrentPlayingId(soundId);
        setIsPlaying(true);
      }
    }
  };

  const handlePauseResume = async () => {
    if (isPlaying) {
      await NativeAlarm.pauseSleepMusic();
      setIsPlaying(false);
    } else if (currentPlayingId) {
      await NativeAlarm.resumeSleepMusic();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = async (vol: number) => {
    setVolume(vol);
    await NativeAlarm.setSleepMusicVolume(vol);
  };

  const handleTimerChange = async (mins: number) => {
    setTimerMinutes(mins);
    if (isPlaying && currentPlayingId) {
      await NativeAlarm.playSleepMusic(currentPlayingId, volume, true, mins);
    }
  };

  const formatRemainingTime = (seconds: number) => {
    if (seconds <= 0) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <Screen padded={false}>
      <View className="flex-1 bg-[#F5F6F8]">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: insets.top + 10,
            paddingBottom: 160 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-3xl font-black text-slate-900 tracking-tight">
                Sleep
              </Text>
              <Text className="text-xs font-semibold text-slate-500 mt-1">
                Relax your mind and prepare for quality rest
              </Text>
            </View>
            <View className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
              <Text className="text-lg">🌙</Text>
            </View>
          </View>

          {/* Sleep Target Stats Card */}
          <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mt-5">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-[11px] uppercase font-black tracking-wider text-[#0284C7]">
                RECOMMENDED SLEEP
              </Text>
              <View className="bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                <Text className="text-[10px] font-black text-[#0284C7]">
                  OPTIMAL
                </Text>
              </View>
            </View>
            <View className="flex-row items-baseline justify-between mt-1">
              <Text className="text-3xl font-black text-slate-900">7h 30m</Text>
              <Text className="text-xs font-bold text-slate-500">
                11:00 PM → 06:30 AM
              </Text>
            </View>
            <View className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
              <View className="bg-[#38BDF8] h-full rounded-full w-[85%]" />
            </View>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-6 -mx-1"
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

          {/* Sleep Music List */}
          <View className="mt-5">
            <View className="flex-row items-center justify-between mb-3 px-1">
              <Text className="text-base font-extrabold text-slate-900">
                Sounds & Melodies
              </Text>
              <Text className="text-xs font-bold text-slate-400">
                {filteredItems.length} sounds
              </Text>
            </View>

            {filteredItems.map(sound => {
              const isThisPlaying =
                currentPlayingId === sound.id && isPlaying;
              return (
                <Pressable
                  key={sound.id}
                  onPress={() => togglePlay(sound.id)}
                  className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                    isThisPlaying
                      ? 'bg-[#E0F2FE] border-[#BAE6FD] shadow-xs'
                      : 'bg-white border-slate-100 shadow-sm active:bg-slate-50'
                  }`}
                >
                  <View className="flex-row items-center flex-1 pr-3">
                    <View className="h-12 w-12 rounded-2xl bg-slate-100/80 items-center justify-center mr-3">
                      <Text className="text-2xl">{sound.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-0.5">
                        <Text
                          className={`text-sm font-extrabold ${
                            isThisPlaying
                              ? 'text-[#0284C7]'
                              : 'text-slate-900'
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

                  <View
                    className={`h-9 w-9 rounded-full items-center justify-center ${
                      isThisPlaying
                        ? 'bg-[#0284C7]'
                        : 'bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        isThisPlaying ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {isThisPlaying ? '❚❚' : '▶'}
                    </Text>
                  </View>
                </Pressable>
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

        {/* Floating Mini Player (Shown when sound is active) */}
        {activeItem && (
          <View
            style={{ bottom: 68 + insets.bottom }}
            className="absolute left-4 right-4"
          >
            <Pressable
              onPress={() => setShowFullPlayer(true)}
              className="bg-[#0F172A] rounded-2xl p-3.5 flex-row items-center justify-between shadow-xl border border-slate-800"
            >
              <View className="flex-row items-center flex-1 pr-3">
                <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-3">
                  <Text className="text-xl">{activeItem.icon}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-white text-sm font-bold"
                    numberOfLines={1}
                  >
                    {activeItem.title}
                  </Text>
                  <Text className="text-slate-400 text-[11px] font-medium">
                    {remainingSecs > 0
                      ? `Timer: ${formatRemainingTime(remainingSecs)}`
                      : 'Looping infinitely'}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <Pressable
                  onPress={handlePauseResume}
                  className="h-9 w-9 rounded-full bg-white items-center justify-center mr-2 active:scale-95"
                >
                  <Text className="text-slate-900 text-xs font-black">
                    {isPlaying ? '❚❚' : '▶'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    NativeAlarm.stopSleepMusic();
                    setIsPlaying(false);
                    setCurrentPlayingId(null);
                  }}
                  className="h-9 w-9 rounded-full bg-slate-800 items-center justify-center active:scale-95"
                >
                  <Text className="text-slate-400 text-xs font-bold">✕</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}

        {/* Full Player & Timer Modal */}
        <Modal
          visible={showFullPlayer}
          transparent
          animationType="slide"
          onRequestClose={() => setShowFullPlayer(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowFullPlayer(false)}>
            <View className="flex-1 bg-black/50 justify-end">
              <TouchableWithoutFeedback>
                <View
                  style={{ paddingBottom: insets.bottom + 20 }}
                  className="bg-white rounded-t-3xl p-6 shadow-2xl"
                >
                  {/* Handle bar */}
                  <View className="h-1 w-12 bg-slate-200 rounded-full self-center mb-5" />

                  {/* Now Playing Header */}
                  {activeItem && (
                    <View className="items-center mb-6">
                      <View className="h-20 w-20 rounded-3xl bg-slate-100 items-center justify-center mb-3 shadow-inner">
                        <Text className="text-4xl">{activeItem.icon}</Text>
                      </View>
                      <Text className="text-xl font-black text-slate-900">
                        {activeItem.title}
                      </Text>
                      <Text className="text-xs font-semibold text-slate-400 mt-1">
                        {activeItem.description}
                      </Text>
                    </View>
                  )}

                  {/* Sleep Timer Selector */}
                  <View className="mb-6">
                    <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Sleep Timer (With 30s Fade Out)
                    </Text>
                    <View className="flex-row justify-between">
                      {TIMER_OPTIONS.map(opt => (
                        <Pressable
                          key={opt.minutes}
                          onPress={() => handleTimerChange(opt.minutes)}
                          className={`px-3 py-2 rounded-xl border ${
                            timerMinutes === opt.minutes
                              ? 'bg-[#0284C7] border-[#0284C7]'
                              : 'bg-slate-50 border-slate-200/60'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              timerMinutes === opt.minutes
                                ? 'text-white'
                                : 'text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {remainingSecs > 0 && (
                      <Text className="text-center text-xs font-extrabold text-[#0284C7] mt-2.5">
                        Fading out in {formatRemainingTime(remainingSecs)}
                      </Text>
                    )}
                  </View>

                  {/* Volume Control */}
                  <View className="mb-6">
                    <Text className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
                      Sound Volume
                    </Text>
                    <View className="flex-row justify-between">
                      {[
                        { label: 'Low', val: 0.3 },
                        { label: 'Medium', val: 0.6 },
                        { label: 'High', val: 0.9 },
                        { label: 'Max', val: 1.0 },
                      ].map(v => (
                        <Pressable
                          key={v.val}
                          onPress={() => handleVolumeChange(v.val)}
                          className={`flex-1 mx-1 py-2 rounded-xl items-center border ${
                            Math.abs(volume - v.val) < 0.1
                              ? 'bg-[#0F172A] border-[#0F172A]'
                              : 'bg-slate-50 border-slate-200/60'
                          }`}
                        >
                          <Text
                            className={`text-xs font-bold ${
                              Math.abs(volume - v.val) < 0.1
                                ? 'text-white'
                                : 'text-slate-700'
                            }`}
                          >
                            {v.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Primary Play / Pause / Stop Buttons */}
                  <View className="flex-row items-center justify-center space-x-4">
                    <Pressable
                      onPress={handlePauseResume}
                      className="flex-1 bg-[#FF385C] py-3.5 rounded-2xl items-center active:opacity-90 mr-2"
                    >
                      <Text className="text-white text-sm font-extrabold">
                        {isPlaying ? 'Pause Sound' : 'Resume Sound'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => {
                        NativeAlarm.stopSleepMusic();
                        setIsPlaying(false);
                        setCurrentPlayingId(null);
                        setShowFullPlayer(false);
                      }}
                      className="bg-slate-100 px-5 py-3.5 rounded-2xl items-center active:bg-slate-200"
                    >
                      <Text className="text-slate-700 text-sm font-bold">
                        Close
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </Screen>
  );
}

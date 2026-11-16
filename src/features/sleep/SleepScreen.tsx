import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/ui/Screen';
import {
  SLEEP_MUSIC_ITEMS,
  type SleepMusicCategory,
  type SleepMusicItem,
} from '@/data/sleepMusic';
import { NativeAlarm } from '@/native/AlarmModule';
import { useAppInsets } from '@/utils/safeArea';
import { Moon, Play, Square, Volume2 } from 'lucide-react-native';

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

function AnimatedEqualizer({ color = '#1652E6' }: { color?: string }) {
  const anim1 = useRef(new Animated.Value(0.4)).current;
  const anim2 = useRef(new Animated.Value(0.9)).current;
  const anim3 = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = (anim: Animated.Value, to: number, dur: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: to,
            duration: dur,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.35,
            duration: dur,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    const a1 = loop(anim1, 1, 380);
    const a2 = loop(anim2, 0.75, 280);
    const a3 = loop(anim3, 0.9, 440);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [anim1, anim2, anim3]);

  return (
    <View className="flex-row items-end h-3.5 w-3.5 justify-between px-0.5">
      {[anim1, anim2, anim3].map((anim, index) => (
        <Animated.View
          key={index}
          // eslint-disable-next-line react-native/no-inline-styles
          style={{
            height: 14,
            backgroundColor: color,
            transform: [{ scaleY: anim }],
          }}
          className="w-0.5 rounded-full"
        />
      ))}
    </View>
  );
}

interface SleepSoundCardProps {
  sound: SleepMusicItem;
  isPlaying: boolean;
  onToggle: (id: string) => void;
}

const SleepSoundCard = React.memo(
  function SleepSoundCardComponent({ sound, isPlaying, onToggle }: SleepSoundCardProps) {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onToggle(sound.id)}
        style={{
          borderColor: isPlaying ? '#1652E6' : '#F1F5F9',
          borderWidth: 1.5,
          backgroundColor: isPlaying ? '#EEF4FF' : '#FFFFFF',
        }}
        className="flex-row items-center justify-between p-4 rounded-2xl mb-2.5"
      >
        <View className="flex-row items-center flex-1 pr-3">
          <View className="relative mr-3">
            <View
              className={`h-12 w-12 rounded-2xl items-center justify-center border ${
                isPlaying
                  ? 'bg-white border-primary'
                  : 'bg-slate-100 border-transparent'
              }`}
            >
              <Text className="text-2xl">{sound.icon}</Text>
            </View>
            {isPlaying && (
              <View className="absolute -bottom-1 -right-1 bg-primary rounded-full h-5 w-5 items-center justify-center border-2 border-white">
                <Volume2 size={10} color="#FFFFFF" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <View className="flex-row items-center mb-0.5">
              <Text
                className={`text-sm font-extrabold ${
                  isPlaying ? 'text-primary' : 'text-slate-900'
                }`}
              >
                {sound.title}
              </Text>
              {isPlaying ? (
                <View className="ml-2 rounded-full bg-primary px-2 py-0.5 flex-row items-center">
                  <AnimatedEqualizer color="#FFFFFF" />
                  <Text className="text-[9px] font-black text-white ml-1 tracking-wider uppercase">
                    PLAYING
                  </Text>
                </View>
              ) : (
                <View className="ml-2 rounded bg-slate-100 px-1.5 py-0.5">
                  <Text className="text-[9px] font-bold text-slate-500">
                    {sound.category}
                  </Text>
                </View>
              )}
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
        <View
          className={`px-3.5 py-2 rounded-xl flex-row items-center ${
            isPlaying ? 'bg-rose-500' : 'bg-primary'
          }`}
        >
          <View className="mr-1.5">
            {isPlaying ? (
              <Square size={12} color="#FFFFFF" fill="#FFFFFF" />
            ) : (
              <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
            )}
          </View>
          <Text className="text-white text-xs font-black">
            {isPlaying ? 'Stop' : 'Play'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.isPlaying === next.isPlaying && prev.sound.id === next.sound.id,
);

export function SleepScreen() {
  const insets = useAppInsets();
  const [selectedCategory, setSelectedCategory] =
    useState<SleepMusicCategory>('All');
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState<number>(0.8);
  const [timerMinutes, setTimerMinutes] = useState<number>(30);
  const lastActionAt = useRef(0);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const currentPlayingIdRef = useRef(currentPlayingId);
  currentPlayingIdRef.current = currentPlayingId;

  useEffect(() => {
    let alive = true;
    // Check initial status on mount once
    NativeAlarm.getSleepMusicStatus()
      .then(status => {
        if (alive && status) {
          setIsPlaying(Boolean(status.isPlaying));
          setCurrentPlayingId(status.currentSoundId);
        }
      })
      .catch(() => {});

    // Only sync if actively playing
    const interval = setInterval(async () => {
      if (!isPlayingRef.current || Date.now() - lastActionAt.current < 3000) return;
      try {
        const status = await NativeAlarm.getSleepMusicStatus();
        if (alive && status) {
          if (status.isPlaying !== isPlayingRef.current) {
            setIsPlaying(status.isPlaying);
          }
          if (status.currentSoundId !== currentPlayingIdRef.current) {
            setCurrentPlayingId(status.currentSoundId);
          }
        }
      } catch {}
    }, 3000);

    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, []);

  const [query, setQuery] = useState('');
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SLEEP_MUSIC_ITEMS.filter(item => {
      const inCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const inQuery = q.length === 0 || item.title.toLowerCase().includes(q);
      return inCategory && inQuery;
    });
  }, [selectedCategory, query]);

  const activeSound = useMemo(
    () => SLEEP_MUSIC_ITEMS.find(s => s.id === currentPlayingId),
    [currentPlayingId],
  );

  const togglePlay = useCallback((soundId: string) => {
    lastActionAt.current = Date.now();
    if (currentPlayingId === soundId && isPlaying) {
      setIsPlaying(false);
      setCurrentPlayingId(null);
      Promise.resolve(NativeAlarm.stopSleepMusic()).catch(() => {});
    } else {
      setCurrentPlayingId(soundId);
      setIsPlaying(true);
      Promise.resolve(NativeAlarm.playSleepMusic(soundId, volume, true, timerMinutes))
        .then(ok => {
          if (!ok) {
            setIsPlaying(false);
            setCurrentPlayingId(null);
          }
        })
        .catch(() => {
          setIsPlaying(false);
          setCurrentPlayingId(null);
        });
    }
  }, [currentPlayingId, isPlaying, volume, timerMinutes]);

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
      <View className="flex-1 bg-background">
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
                  <TouchableOpacity
                    key={opt.minutes}
                    activeOpacity={0.75}
                    onPress={() => handleTimerChange(opt.minutes)}
                    className={`px-2.5 py-1 rounded-lg ml-1.5 border ${
                      timerMinutes === opt.minutes
                        ? 'bg-primary border-primary'
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
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Volume
              </Text>
              <View className="flex-row">
                {[0.4, 0.7, 1.0].map((vol, i) => (
                  <TouchableOpacity
                    key={vol}
                    activeOpacity={0.75}
                    onPress={() => handleVolumeChange(vol)}
                    className={`px-3 py-1 rounded-lg ml-1.5 border ${
                      volume === vol
                        ? 'bg-primary border-primary'
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
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search sleep sounds"
            placeholderTextColor="#556889"
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 mb-3 text-sm text-navy"
          />
          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4 -mx-1"
            // eslint-disable-next-line react-native/no-inline-styles
            contentContainerStyle={{ paddingHorizontal: 4 }}
          >
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.75}
                onPress={() => setSelectedCategory(cat)}
                className={`mr-2 px-4 py-2 rounded-2xl border ${
                  selectedCategory === cat
                    ? 'bg-navy border-navy'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedCategory === cat ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
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

            {filteredItems.map(sound => (
              <SleepSoundCard
                key={sound.id}
                sound={sound}
                isPlaying={currentPlayingId === sound.id && isPlaying}
                onToggle={togglePlay}
              />
            ))}
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

        {/* Floating Now Playing Mini-Player Bar when Audio is Active */}
        {isPlaying && activeSound && (
          <View
            style={{ bottom: Math.max(insets.bottom + 8, 20) }}
            className="absolute left-4 right-4 bg-slate-900 rounded-2xl p-3.5 flex-row items-center justify-between border border-slate-700 shadow-2xl"
          >
            <View className="flex-row items-center flex-1 mr-3">
              <View className="h-10 w-10 rounded-xl bg-white/10 items-center justify-center mr-2.5">
                <Text className="text-xl">{activeSound.icon}</Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text
                    className="text-white text-xs font-black mr-2"
                    numberOfLines={1}
                  >
                    {activeSound.title}
                  </Text>
                  <AnimatedEqualizer color="#FF7A00" />
                </View>
                <Text className="text-slate-400 text-[10px] font-semibold mt-0.5">
                  Playing now • {timerMinutes > 0 ? `Timer: ${timerMinutes}m` : 'Looping'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => togglePlay(activeSound.id)}
              className="bg-rose-500 px-3.5 py-2 rounded-xl flex-row items-center shadow-xs"
            >
              <Text className="text-white text-xs font-black mr-1">■</Text>
              <Text className="text-white text-xs font-black">Stop</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Screen>
  );
}

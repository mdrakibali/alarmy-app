import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';

const SLEEP_SOUNDS = [
  { id: 'rain', label: 'Gentle Rain', icon: '🌧️', subtitle: 'Calming soft rain shower' },
  { id: 'waves', label: 'Ocean Waves', icon: '🌊', subtitle: 'Rhythmic sea waves' },
  { id: 'forest', label: 'Night Forest', icon: '🌲', subtitle: 'Wind through pine trees' },
  { id: 'fireplace', label: 'Cozy Fireplace', icon: '🔥', subtitle: 'Warm crackling wood' },
  { id: 'whitenoise', label: 'White Noise', icon: '📻', subtitle: 'Deep sleep sound mask' },
];

export function SleepScreen() {
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const toggleSound = (id: string) => {
    setActiveSound(prev => (prev === id ? null : id));
  };

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1 bg-slate-950"
        contentContainerClassName="px-5 pb-10 pt-2"
      >
        <Text className="text-3xl font-bold text-white">Sleep</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Relax your mind and prepare for quality rest
        </Text>

        {/* Sleep Target Card */}
        <View className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mt-5">
          <Text className="text-xs uppercase font-bold tracking-wider text-amber-400">
            SLEEP TARGET
          </Text>
          <View className="flex-row items-baseline justify-between mt-2">
            <Text className="text-3xl font-bold text-white">7h 30m</Text>
            <Text className="text-sm text-slate-400">11:00 PM → 06:30 AM</Text>
          </View>
          <View className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
            <View className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }} />
          </View>
        </View>

        {/* Ambient Sleep Sounds */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-white">Relaxing Sounds</Text>
            {activeSound && (
              <Text className="text-xs font-semibold text-amber-400">
                Playing now 🎵
              </Text>
            )}
          </View>

          {SLEEP_SOUNDS.map(sound => {
            const isPlaying = activeSound === sound.id;
            return (
              <Pressable
                key={sound.id}
                onPress={() => toggleSound(sound.id)}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                  isPlaying
                    ? 'bg-amber-500/10 border-amber-500'
                    : 'bg-slate-900 border-slate-900'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-3xl mr-3">{sound.icon}</Text>
                  <View>
                    <Text className="text-base font-semibold text-white">
                      {sound.label}
                    </Text>
                    <Text className="text-xs text-slate-400 mt-0.5">
                      {sound.subtitle}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${
                    isPlaying ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isPlaying ? 'text-slate-950' : 'text-slate-300'
                    }`}
                  >
                    {isPlaying ? 'Stop' : 'Play'}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Sleep Hygiene Tips */}
        <View className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 mt-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            SLEEP TIP
          </Text>
          <Text className="text-sm text-slate-300 leading-relaxed">
            Avoid blue light from screens 30 minutes before sleep. Melatonin production peaks in complete darkness.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}


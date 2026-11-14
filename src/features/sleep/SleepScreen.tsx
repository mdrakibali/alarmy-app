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
        className="flex-1 bg-[#F5F6F8]"
        contentContainerClassName="px-5 pb-12 pt-3"
      >
        <Text className="text-3xl font-extrabold text-slate-900">Sleep</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Relax your mind and prepare for quality rest
        </Text>

        {/* Sleep Target Card */}
        <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 mt-5">
          <Text className="text-xs uppercase font-bold tracking-wider text-[#38BDF8]">
            SLEEP TARGET
          </Text>
          <View className="flex-row items-baseline justify-between mt-2">
            <Text className="text-3xl font-black text-slate-900">7h 30m</Text>
            <Text className="text-xs font-bold text-slate-500">11:00 PM → 06:30 AM</Text>
          </View>
          <View className="w-full bg-slate-100 h-2.5 rounded-full mt-4 overflow-hidden">
            <View className="bg-[#38BDF8] h-full rounded-full" style={{ width: '85%' }} />
          </View>
        </View>

        {/* Ambient Sleep Sounds */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-lg font-bold text-slate-900">Relaxing Sounds</Text>
            {activeSound && (
              <Text className="text-xs font-bold text-[#FF385C]">
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
                    ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-3xl mr-3">{sound.icon}</Text>
                  <View>
                    <Text className="text-base font-bold text-slate-900">
                      {sound.label}
                    </Text>
                    <Text className="text-xs font-medium text-slate-400 mt-0.5">
                      {sound.subtitle}
                    </Text>
                  </View>
                </View>
                <View
                  className={`px-3 py-1.5 rounded-full ${
                    isPlaying ? 'bg-[#0284C7]' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isPlaying ? 'text-white' : 'text-slate-600'
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
        <View className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 mt-4">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            SLEEP TIP
          </Text>
          <Text className="text-sm text-slate-600 leading-relaxed">
            Avoid blue light from screens 30 minutes before sleep. Melatonin production peaks in complete darkness.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

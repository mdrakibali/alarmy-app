import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';

const ROUTINE_ITEMS = [
  { id: 'water', label: 'Drink a glass of water', icon: '💧' },
  { id: 'stretch', label: '5-minute morning stretch', icon: '🧘' },
  { id: 'sunlight', label: 'Get direct sunlight for 10 mins', icon: '☀️' },
  { id: 'plan', label: 'Review today’s top 3 priorities', icon: '🎯' },
];

export function MorningScreen() {
  const [completed, setCompleted] = useState<string[]>(['water']);

  const toggleRoutine = (id: string) => {
    setCompleted(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id],
    );
  };

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1 bg-slate-950"
        contentContainerClassName="px-5 pb-10 pt-2"
      >
        <Text className="text-3xl font-bold text-white">Morning</Text>
        <Text className="text-sm text-slate-400 mt-1">
          Start your day energized and focused
        </Text>

        {/* Wake-up Streak Card */}
        <View className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 mt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase font-bold tracking-wider text-amber-400">
                WAKE-UP STREAK
              </Text>
              <Text className="text-4xl font-extrabold text-white mt-1">
                5 Days 🔥
              </Text>
            </View>
            <View className="h-12 w-12 rounded-full bg-amber-500 items-center justify-center">
              <Text className="text-2xl">⚡</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-300 mt-3">
            Waking up on time consistently improves dopamine and morning clarity.
          </Text>
        </View>

        {/* Morning Routine Checklist */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-white mb-3">
            Morning Routine
          </Text>
          {ROUTINE_ITEMS.map(item => {
            const isDone = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleRoutine(item.id)}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 ${
                  isDone
                    ? 'bg-slate-900/60 border border-slate-800'
                    : 'bg-slate-900'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <Text
                    className={`text-base font-medium ${
                      isDone
                        ? 'text-slate-400 line-through'
                        : 'text-white'
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 rounded-full items-center justify-center border ${
                    isDone
                      ? 'bg-amber-500 border-amber-500'
                      : 'border-slate-600'
                  }`}
                >
                  {isDone && (
                    <Text className="text-slate-950 font-bold text-xs">✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Daily Motivation */}
        <View className="bg-slate-900 rounded-2xl p-5 mt-6 border border-slate-800">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            DAILY QUOTE
          </Text>
          <Text className="text-base text-slate-200 italic leading-relaxed">
            "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them."
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}


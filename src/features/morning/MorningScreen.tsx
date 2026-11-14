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
        className="flex-1 bg-[#F5F6F8]"
        contentContainerClassName="px-5 pb-12 pt-3"
      >
        <Text className="text-3xl font-extrabold text-slate-900">Morning</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Start your day energized and focused
        </Text>

        {/* Wake-up Streak Card */}
        <View className="bg-white rounded-3xl p-6 mt-5 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs uppercase font-bold tracking-wider text-amber-500">
                WAKE-UP STREAK
              </Text>
              <Text className="text-4xl font-black text-slate-900 mt-1">
                5 Days 🔥
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-amber-50 items-center justify-center">
              <Text className="text-3xl">⚡</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-500 mt-3">
            Waking up on time consistently improves dopamine and morning clarity.
          </Text>
        </View>

        {/* Morning Routine Checklist */}
        <View className="mt-6">
          <Text className="text-lg font-bold text-slate-900 mb-3 px-1">
            Morning Routine
          </Text>
          {ROUTINE_ITEMS.map(item => {
            const isDone = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleRoutine(item.id)}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                  isDone
                    ? 'bg-slate-50 border-slate-200/60'
                    : 'bg-white border-slate-100 shadow-sm'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <Text
                    className={`text-base font-semibold ${
                      isDone
                        ? 'text-slate-400 line-through'
                        : 'text-slate-800'
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 rounded-full items-center justify-center border ${
                    isDone
                      ? 'bg-[#38BDF8] border-[#38BDF8]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isDone && (
                    <Text className="text-white font-bold text-xs">✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Daily Motivation */}
        <View className="bg-white rounded-3xl p-5 mt-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            DAILY QUOTE
          </Text>
          <Text className="text-sm font-medium text-slate-700 italic leading-relaxed">
            "Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them."
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { DAILY_QUOTES, DEFAULT_ROUTINES, useMorningStore } from '@/storage/morningStore';
import { useAppInsets } from '@/utils/safeArea';

export function MorningScreen() {
  const insets = useAppInsets();

  const completed = useMorningStore(s => s.completedItems);
  const streakDays = useMorningStore(s => s.streakDays);
  const toggleRoutine = useMorningStore(s => s.toggleRoutine);
  const quoteIndex = useMorningStore(s => s.quoteIndex);
  const nextQuote = useMorningStore(s => s.nextQuote);

  const currentQuote = DAILY_QUOTES[quoteIndex] || DAILY_QUOTES[0];
  const completedCount = completed.length;
  const totalCount = DEFAULT_ROUTINES.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <Screen padded={false}>
      <ScrollView
        className="flex-1 bg-[#FBFBF9]"
        contentContainerClassName="px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-black text-[#1A2E22] tracking-tight">Morning</Text>
        <Text className="text-sm text-[#5E7166] mt-1">
          Start your day energized, focused, and intentional
        </Text>

        {/* Wake-up Streak Card */}
        <View className="bg-white rounded-3xl p-6 mt-5 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] uppercase font-black tracking-wider text-[#D97706]">
                WAKE-UP STREAK
              </Text>
              <Text className="text-4xl font-black text-[#1A2E22] mt-1">
                {streakDays} Days 🔥
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-[#FEF3C7] items-center justify-center border border-[#FDE68A]">
              <Text className="text-3xl">⚡</Text>
            </View>
          </View>
          <Text className="text-xs text-[#5E7166] mt-3">
            Waking up on time consistently boosts morning dopamine, focus, and energy.
          </Text>
        </View>

        {/* Morning Routine Checklist (Persistent in MMKV) */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-lg font-black text-[#1A2E22]">
              Morning Routine Checklist
            </Text>
            <View className="bg-[#EBF3ED] px-2.5 py-1 rounded-full border border-[#6B8F71]/30">
              <Text className="text-xs font-bold text-[#4E7D5B]">
                {completedCount}/{totalCount} Done ({progressPercent}%)
              </Text>
            </View>
          </View>

          {DEFAULT_ROUTINES.map(item => {
            const isDone = completed.includes(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => toggleRoutine(item.id)}
                className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                  isDone
                    ? 'bg-[#EBF3ED]/60 border-[#6B8F71]/20'
                    : 'bg-white border-slate-100 shadow-xs active:bg-slate-50'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <Text
                    className={`text-base font-semibold ${
                      isDone
                        ? 'text-[#5E7166] line-through'
                        : 'text-[#1A2E22]'
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 rounded-full items-center justify-center border ${
                    isDone
                      ? 'bg-[#4E7D5B] border-[#4E7D5B]'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isDone && (
                    <Text className="text-white font-black text-xs">✓</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Daily Motivation Card with Cycle Action */}
        <Pressable
          onPress={nextQuote}
          className="bg-white rounded-3xl p-5 mt-4 border border-slate-100 shadow-sm active:bg-slate-50"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-black uppercase tracking-wider text-[#4E7D5B]">
              DAILY WISDOM ☀️
            </Text>
            <Text className="text-xs text-[#5E7166] font-semibold">Tap to cycle ↻</Text>
          </View>
          <Text className="text-sm font-medium text-[#1A2E22] italic leading-relaxed">
            "{currentQuote.quote}"
          </Text>
          <Text className="text-xs font-bold text-[#5E7166] mt-2 text-right">
            — {currentQuote.author}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen } from '@/components/ui/Screen';
import { DAILY_QUOTES, DEFAULT_ROUTINES, useMorningStore } from '@/storage/morningStore';
import { useAppInsets } from '@/utils/safeArea';
import type { RootStackParamList } from '@/navigation/types';

export function MorningScreen() {
  const insets = useAppInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
        className="flex-1 bg-background"
        contentContainerClassName="px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 10,
          paddingBottom: 120 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-3xl font-black text-navy tracking-tight">Morning</Text>
        <Text className="text-sm text-subtext mt-1">
          Start your day energized, focused, and intentional
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Report')}
          className="mt-4 self-start px-3 py-2 rounded-full bg-white border border-primary/30"
        >
          <Text className="text-xs font-bold text-navy">Wake history</Text>
        </Pressable>

        {/* Wake-up Streak Card */}
        <View className="bg-white rounded-3xl p-6 mt-5 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[11px] uppercase font-black tracking-wider text-secondary">
                WAKE-UP STREAK
              </Text>
              <Text className="text-4xl font-black text-navy mt-1">
                {streakDays} Days 🔥
              </Text>
            </View>
            <View className="h-14 w-14 rounded-full bg-secondary/10 items-center justify-center border border-secondary/20">
              <Text className="text-3xl">⚡</Text>
            </View>
          </View>
          <Text className="text-xs text-subtext mt-3">
            Waking up on time consistently boosts morning dopamine, focus, and energy.
          </Text>
        </View>

        {/* Morning Routine Checklist (Persistent in MMKV) */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-lg font-black text-navy">
              Morning Routine Checklist
            </Text>
            <View className="bg-ice px-2.5 py-1 rounded-full border border-primary/25">
              <Text className="text-xs font-bold text-primary">
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
                    ? 'bg-ice/70 border-primary/20'
                    : 'bg-white border-slate-100 shadow-xs active:bg-slate-50'
                }`}
              >
                <View className="flex-row items-center flex-1 pr-3">
                  <Text className="text-2xl mr-3">{item.icon}</Text>
                  <Text
                    className={`text-base font-semibold ${
                      isDone
                        ? 'text-subtext line-through'
                        : 'text-navy'
                    }`}
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  className={`h-6 w-6 rounded-full items-center justify-center border ${
                    isDone
                      ? 'bg-primary border-primary'
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
            <Text className="text-xs font-black uppercase tracking-wider text-primary">
              DAILY WISDOM ☀️
            </Text>
            <Text className="text-xs text-subtext font-semibold">Tap to cycle ↻</Text>
          </View>
          <Text className="text-sm font-medium text-navy italic leading-relaxed">
            "{currentQuote.quote}"
          </Text>
          <Text className="text-xs font-bold text-subtext mt-2 text-right">
            — {currentQuote.author}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

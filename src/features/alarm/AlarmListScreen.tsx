import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppInsets } from '@/utils/safeArea';
import { Screen } from '@/components/ui/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import { formatTime, sortAlarms } from './format';
import { nextOccurrence } from './nextOccurrence';
import type { Alarm } from './types';
import { DaypartHeader } from './DaypartHeader';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmListScreen() {
  const insets = useAppInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alarms = useAlarmStore(s => s.alarms);
  const toggleAlarm = useAlarmStore(s => s.toggleAlarm);
  const sorted = sortAlarms(alarms);
  const [nowTimestamp, setNowTimestamp] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown to earliest upcoming enabled alarm
  const nextAlarmCountdown = useMemo(() => {
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return null;

    const now = new Date();
    let earliestMs = Infinity;

    for (const alarm of enabledAlarms) {
      const nextDate = nextOccurrence(alarm, now);
      const diff = nextDate.getTime() - now.getTime();
      if (diff > 0 && diff < earliestMs) {
        earliestMs = diff;
      }
    }

    if (earliestMs === Infinity) return null;

    const totalMinutes = Math.floor(earliestMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return 'less than a minute';
    if (hours === 0) return `${minutes} min`;
    return `${hours} hr. ${minutes} min`;
  }, [alarms, nowTimestamp]);

  return (
    <Screen padded={false}>
      <View className="flex-1 bg-[#FBFBF9]">
        <DaypartHeader now={new Date(nowTimestamp)} countdown={nextAlarmCountdown} />
        <Pressable
          onPress={() => navigation.navigate('AlarmEdit')}
          className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
        >
          <View className="flex-row items-center flex-1">
            <View className="mr-3 h-8 px-2 items-center justify-center rounded-lg bg-[#4E7D5B]">
              <Text className="text-xs font-black tracking-wider text-white">
                NEW
              </Text>
            </View>
            <View>
              <Text className="text-xs font-semibold text-slate-400">
                Overslept AGAIN?
              </Text>
              <Text className="text-sm font-bold text-[#1A2E22]">
                Try our new wake-up missions
              </Text>
            </View>
          </View>
          <Text className="text-lg font-bold text-slate-400">›</Text>
        </Pressable>

        <View className="flex-row items-center justify-between px-5 py-2">
          <Text className="text-sm font-bold text-slate-700">
            {nextAlarmCountdown ? `Ring in ${nextAlarmCountdown}` : 'No upcoming alarms'}
          </Text>
        </View>

        {/* Alarms List */}
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 160 + insets.bottom,
          }}
          ListEmptyComponent={
            <EmptyState onAdd={() => navigation.navigate('AlarmEdit')} />
          }
          renderItem={({ item }) => (
            <AlarmCard
              alarm={item}
              onPress={() => navigation.navigate('AlarmEdit', { id: item.id })}
              onToggle={() => toggleAlarm(item.id)}
            />
          )}
        />

        {/* Floating Action Button (FAB) */}
        <View
          style={{ bottom: 76 + insets.bottom }}
          className="absolute right-5"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add alarm"
            onPress={() => navigation.navigate('AlarmEdit')}
            className="h-16 w-16 items-center justify-center rounded-full bg-[#6B8F71] shadow-2xl active:scale-95"
          >
            <Text className="text-3xl font-light text-white leading-none">
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

function AlarmCard({
  alarm,
  onPress,
  onToggle,
}: {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
}) {
  const { time, period } = formatTime(alarm.hour, alarm.minute);
  const hasMission = alarm.missions.length > 0;
  const missionIcon = alarm.missions.includes('math')
    ? '🧠'
    : alarm.missions.includes('shake')
    ? '📱'
    : alarm.missions.includes('photo')
    ? '📸'
    : alarm.missions.includes('squat')
    ? '🏋️'
    : alarm.missions.includes('qr')
    ? '📷'
    : '🎯';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3.5 rounded-3xl bg-white p-5 shadow-sm border border-slate-100/90 active:bg-slate-50"
    >
      {/* Top Row: S M T W T F S and Switch */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {DAY_LABELS.map((dayLabel, index) => {
            const isSelected = alarm.repeatDays.includes(index);
            return (
              <Text
                key={index}
                className={`mr-3 text-xs font-bold ${
                  isSelected ? 'text-[#1A2E22] font-extrabold' : 'text-slate-300'
                }`}
              >
                {dayLabel}
              </Text>
            );
          })}
        </View>

        {/* Custom Alba Sage Switch */}
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E2E8F0', true: '#6B8F71' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Middle Row: Big Time and Mission Icon */}
      <View className="my-2 flex-row items-baseline flex-wrap">
        <Text
          className={`text-4xl font-black ${
            alarm.enabled ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          {time}
        </Text>
        <Text
          className={`ml-1.5 text-base font-bold ${
            alarm.enabled ? 'text-slate-700' : 'text-slate-400'
          }`}
        >
          {period}
        </Text>
        {hasMission && (
          <View className="ml-3 rounded-lg bg-slate-100 px-2 py-0.5">
            <Text className="text-xs">{missionIcon}</Text>
          </View>
        )}
      </View>

      {/* Bottom Row: Label & Menu */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex-row items-center flex-1 pr-2">
          <Text className="mr-1 text-sm">🐥</Text>
          <Text
            className="text-xs font-semibold text-slate-500"
            numberOfLines={1}
          >
            {alarm.label || 'Wake up early'}
          </Text>
        </View>
        <Text className="text-base font-bold text-slate-300">⋮</Text>
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center justify-center py-20 px-6">
      <View className="h-20 w-20 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Text className="text-3xl">⏰</Text>
      </View>
      <Text className="text-lg font-bold text-slate-800">No alarms yet</Text>
      <Text className="mb-6 mt-1.5 text-center text-sm text-slate-500">
        Tap the green button below to schedule your first smart alarm.
      </Text>
      <Pressable
        onPress={onAdd}
        className="rounded-2xl bg-[#4E7D5B] px-6 py-3.5 shadow-sm active:opacity-90"
      >
        <Text className="text-sm font-bold text-white">Create Alarm</Text>
      </Pressable>
    </View>
  );
}

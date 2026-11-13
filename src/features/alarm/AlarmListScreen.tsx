import React from 'react';
import { FlatList, Pressable, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import { formatRepeat, formatTime, sortAlarms } from './format';
import type { Alarm } from './types';

export function AlarmListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const alarms = useAlarmStore(s => s.alarms);
  const toggleAlarm = useAlarmStore(s => s.toggleAlarm);
  const sorted = sortAlarms(alarms);

  return (
    <Screen padded={false}>
      <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
        <Text className="text-3xl font-bold text-white">Alarms</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add alarm"
          onPress={() => navigation.navigate('AlarmEdit')}
          className="h-11 w-11 items-center justify-center rounded-full bg-amber-500 active:opacity-80"
        >
          <Text className="text-2xl font-semibold text-slate-950">+</Text>
        </Pressable>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={item => item.id}
        contentContainerClassName="grow px-5 pb-8"
        ListEmptyComponent={<EmptyState onAdd={() => navigation.navigate('AlarmEdit')} />}
        renderItem={({ item }) => (
          <AlarmRow
            alarm={item}
            onPress={() => navigation.navigate('AlarmEdit', { id: item.id })}
            onToggle={() => toggleAlarm(item.id)}
          />
        )}
      />
    </Screen>
  );
}

function AlarmRow({
  alarm,
  onPress,
  onToggle,
}: {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
}) {
  const { time, period } = formatTime(alarm.hour, alarm.minute);

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center rounded-2xl bg-slate-900 px-4 py-4 active:bg-slate-800"
    >
      <View className="flex-1">
        <View className="flex-row items-baseline">
          <Text
            className={`text-4xl font-semibold ${
              alarm.enabled ? 'text-white' : 'text-slate-500'
            }`}
          >
            {time}
          </Text>
          <Text
            className={`ml-1 text-base font-medium ${
              alarm.enabled ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {period}
          </Text>
        </View>
        <Text className="mt-1 text-sm text-slate-400" numberOfLines={1}>
          {formatRepeat(alarm.repeatDays)}
          {alarm.label ? ` · ${alarm.label}` : ''}
        </Text>
      </View>
      <Switch
        value={alarm.enabled}
        onValueChange={onToggle}
        trackColor={{ false: '#334155', true: '#f59e0b' }}
        thumbColor="#f8fafc"
      />
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="flex-1 items-center justify-center px-6">
      <Text className="text-lg font-semibold text-white">No alarms yet</Text>
      <Text className="mb-6 mt-2 text-center text-sm text-slate-400">
        Add an alarm. It will be saved on this phone. Ringing starts in the next step.
      </Text>
      <Button label="Add alarm" onPress={onAdd} />
    </View>
  );
}

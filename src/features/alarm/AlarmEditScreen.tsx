import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Row, Section } from '@/components/ui/Section';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import { Chip } from './Chip';
import {
  MISSION_LABEL,
  SNOOZE_COUNTS,
  SNOOZE_INTERVALS,
  SOUND_OPTIONS,
  blankAlarm,
  formatTime,
} from './format';
import type { Alarm, MissionType } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmEdit'>;

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const VOLUMES = [
  { value: 0.4, label: 'Low' },
  { value: 0.7, label: 'Med' },
  { value: 1, label: 'Max' },
];

export function AlarmEditScreen({ navigation, route }: Props) {
  const existingId = route.params?.id;
  const existing = useAlarmStore(s =>
    existingId ? s.alarms.find(a => a.id === existingId) : undefined,
  );
  const addAlarm = useAlarmStore(s => s.addAlarm);
  const updateAlarm = useAlarmStore(s => s.updateAlarm);
  const removeAlarm = useAlarmStore(s => s.removeAlarm);

  const [draft, setDraft] = useState<Omit<Alarm, 'id'>>(
    () => existing ?? blankAlarm(),
  );
  const [showPicker, setShowPicker] = useState(false);

  const patch = (next: Partial<Omit<Alarm, 'id'>>) =>
    setDraft(current => ({ ...current, ...next }));

  const pickerDate = new Date();
  pickerDate.setHours(draft.hour, draft.minute, 0, 0);
  const { time, period } = formatTime(draft.hour, draft.minute);

  const toggleDay = (day: number) => {
    const has = draft.repeatDays.includes(day);
    patch({
      repeatDays: has
        ? draft.repeatDays.filter(d => d !== day)
        : [...draft.repeatDays, day],
    });
  };

  const toggleMission = (mission: MissionType) => {
    const has = draft.missions.includes(mission);
    patch({
      missions: has
        ? draft.missions.filter(m => m !== mission)
        : [...draft.missions, mission],
    });
  };

  const save = () => {
    const label = draft.label.trim() || 'Alarm';
    const next = { ...draft, label };
    if (existingId && existing) {
      updateAlarm(existingId, next);
    } else {
      addAlarm(next);
    }
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existingId) {
      return;
    }
    Alert.alert('Delete alarm', 'This alarm will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeAlarm(existingId);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-950"
      contentContainerClassName="px-5 pb-10 pt-4"
      keyboardShouldPersistTaps="handled"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Change time"
        onPress={() => setShowPicker(true)}
        className="mb-6 items-center rounded-3xl bg-slate-900 py-8 active:bg-slate-800"
      >
        <View className="flex-row items-baseline">
          <Text className="text-6xl font-semibold text-white">{time}</Text>
          <Text className="ml-2 text-2xl font-medium text-amber-400">
            {period}
          </Text>
        </View>
        <Text className="mt-2 text-sm text-slate-400">Tap to change</Text>
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="time"
          is24Hour={false}
          onChange={(event, selected) => {
            setShowPicker(false);
            if (event.type === 'set' && selected) {
              patch({
                hour: selected.getHours(),
                minute: selected.getMinutes(),
              });
            }
          }}
        />
      ) : null}

      <Section title="Repeat">
        <View className="flex-row justify-between px-3 py-3">
          {DAYS.map((label, day) => {
            const selected = draft.repeatDays.includes(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="button"
                accessibilityLabel={`Day ${day}`}
                accessibilityState={{ selected }}
                onPress={() => toggleDay(day)}
                className={`h-10 w-10 items-center justify-center rounded-full ${
                  selected ? 'bg-amber-500' : 'bg-slate-800'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? 'text-slate-950' : 'text-slate-300'
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Section title="Label">
        <TextInput
          value={draft.label}
          onChangeText={label => patch({ label })}
          placeholder="Alarm"
          placeholderTextColor="#64748b"
          className="px-4 py-4 text-base text-white"
        />
      </Section>

      <Section title="Sound">
        <View className="flex-row flex-wrap px-4 py-3">
          {SOUND_OPTIONS.map(option => (
            <Chip
              key={option.id}
              label={option.label}
              selected={draft.soundId === option.id}
              onPress={() => patch({ soundId: option.id })}
            />
          ))}
        </View>
      </Section>

      <Section title="Volume">
        <View className="flex-row flex-wrap px-4 py-3">
          {VOLUMES.map(option => (
            <Chip
              key={option.label}
              label={option.label}
              selected={draft.volume === option.value}
              onPress={() => patch({ volume: option.value })}
            />
          ))}
        </View>
      </Section>

      <Section title="Options">
        <Row>
          <Text className="text-base text-white">Vibrate</Text>
          <Switch
            value={draft.vibrate}
            onValueChange={vibrate => patch({ vibrate })}
            trackColor={{ false: '#334155', true: '#f59e0b' }}
            thumbColor="#f8fafc"
          />
        </Row>
        <Row last>
          <Text className="text-base text-white">Snooze</Text>
          <Switch
            value={draft.snooze.enabled}
            onValueChange={enabled =>
              patch({ snooze: { ...draft.snooze, enabled } })
            }
            trackColor={{ false: '#334155', true: '#f59e0b' }}
            thumbColor="#f8fafc"
          />
        </Row>
      </Section>

      {draft.snooze.enabled ? (
        <Section title="Snooze">
          <Text className="px-4 pt-3 text-sm text-slate-400">
            Minutes between rings
          </Text>
          <View className="flex-row flex-wrap px-4 py-3">
            {SNOOZE_INTERVALS.map(minutes => (
              <Chip
                key={minutes}
                label={`${minutes} min`}
                selected={draft.snooze.intervalMin === minutes}
                onPress={() =>
                  patch({ snooze: { ...draft.snooze, intervalMin: minutes } })
                }
              />
            ))}
          </View>
          <Text className="px-4 text-sm text-slate-400">How many times</Text>
          <View className="flex-row flex-wrap px-4 py-3">
            {SNOOZE_COUNTS.map(count => (
              <Chip
                key={count}
                label={`${count}`}
                selected={draft.snooze.maxCount === count}
                onPress={() =>
                  patch({ snooze: { ...draft.snooze, maxCount: count } })
                }
              />
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Mission">
        <Text className="px-4 pt-3 text-sm text-slate-400">
          Saved now. Missions start working in a later step.
        </Text>
        <View className="flex-row flex-wrap px-4 py-3">
          {(Object.keys(MISSION_LABEL) as MissionType[]).map(mission => (
            <Chip
              key={mission}
              label={MISSION_LABEL[mission]}
              selected={draft.missions.includes(mission)}
              onPress={() => toggleMission(mission)}
            />
          ))}
        </View>
      </Section>

      <Button label="Save alarm" onPress={save} />
      {existingId ? (
        <View className="mt-3">
          <Button label="Delete alarm" variant="danger" onPress={confirmDelete} />
        </View>
      ) : null}
    </ScrollView>
  );
}

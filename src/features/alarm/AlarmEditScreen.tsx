import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import {
  SNOOZE_COUNTS,
  SNOOZE_INTERVALS,
  SOUND_OPTIONS,
  blankAlarm,
} from './format';
import { nextOccurrence } from './nextOccurrence';
import type { Alarm, MissionType } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'AlarmEdit'>;

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmEditScreen({ navigation, route }: Props) {
  const existingId = route.params?.id;
  const existing = useAlarmStore(s =>
    existingId ? s.alarms.find(a => a.id === existingId) : undefined,
  );
  const addAlarm = useAlarmStore(s => s.addAlarm);
  const updateAlarm = useAlarmStore(s => s.updateAlarm);
  const removeAlarm = useAlarmStore(s => s.removeAlarm);

  const [draft, setDraft] = useState<Omit<Alarm, 'id'>>(() =>
    existing ? { ...existing } : blankAlarm(),
  );

  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const patch = (next: Partial<Omit<Alarm, 'id'>>) =>
    setDraft(current => ({ ...current, ...next }));

  // Live countdown text
  const countdownText = useMemo(() => {
    const now = new Date();
    const nextDate = nextOccurrence(draft, now);
    const diff = nextDate.getTime() - now.getTime();
    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0 && minutes === 0) return 'Ring in less than a minute';
    if (hours === 0) return `Ring in ${minutes} minutes`;
    return `Ring in ${hours} hr. ${minutes} min`;
  }, [draft.hour, draft.minute, draft.repeatDays]);

  const isDaily = draft.repeatDays.length === 7;

  const toggleDaily = () => {
    if (isDaily) {
      patch({ repeatDays: [] });
    } else {
      patch({ repeatDays: [0, 1, 2, 3, 4, 5, 6] });
    }
  };

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
    const label = draft.label.trim() || 'Wake up early';
    const next = { ...draft, label };
    if (existingId && existing) {
      updateAlarm(existingId, next);
    } else {
      addAlarm(next);
    }
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existingId) return;
    Alert.alert('Delete alarm', 'This alarm will be removed from your device.', [
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
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Top Navigation Bar */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2 bg-white border-b border-slate-100">
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          className="p-1"
        >
          <Text className="text-xl font-bold text-slate-700">✕</Text>
        </Pressable>
        <Text className="text-base font-bold text-slate-900">
          Wake-up alarm
        </Text>
        {existingId ? (
          <Pressable onPress={confirmDelete} hitSlop={10} className="p-1">
            <Text className="text-sm font-semibold text-rose-500">Delete</Text>
          </Pressable>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-28 pt-3"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Alarm Name Input Row */}
        <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3.5 mb-2 border border-slate-100 shadow-sm">
          <Text className="mr-3 text-2xl">☀️</Text>
          <TextInput
            value={draft.label}
            onChangeText={label => patch({ label })}
            placeholder="Please fill in the alarm name"
            placeholderTextColor="#94A3B8"
            className="flex-1 text-base font-semibold text-slate-800"
          />
          <Text className="text-base text-slate-400">✏️</Text>
        </View>

        {/* Live Countdown Text */}
        <Text className="text-center text-xs font-semibold text-slate-400 my-2">
          {countdownText}
        </Text>

        {/* Custom Wheel / Drum Time Picker (NO system dialog!) */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm items-center">
          <WheelTimePicker
            hour={draft.hour}
            minute={draft.minute}
            onChange={(h, m) => patch({ hour: h, minute: m })}
          />
        </View>

        {/* Day Selector Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-slate-800">Repeat</Text>
            <Pressable
              onPress={toggleDaily}
              className="flex-row items-center active:opacity-75"
            >
              <View
                className={`h-4 w-4 rounded items-center justify-center mr-1.5 border ${
                  isDaily
                    ? 'bg-[#0284C7] border-[#0284C7]'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isDaily && (
                  <Text className="text-white text-[10px] font-bold">✓</Text>
                )}
              </View>
              <Text className="text-xs font-semibold text-slate-600">Daily</Text>
            </Pressable>
          </View>

          {/* 7 Days Pills */}
          <View className="flex-row justify-between">
            {DAY_LABELS.map((dayLabel, index) => {
              const selected = draft.repeatDays.includes(index);
              return (
                <Pressable
                  key={index}
                  onPress={() => toggleDay(index)}
                  className={`h-11 w-11 items-center justify-center rounded-2xl border ${
                    selected
                      ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                      : 'bg-slate-100 border-slate-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      selected ? 'text-[#0284C7]' : 'text-slate-500'
                    }`}
                  >
                    {dayLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Wake-up Mission Section (0/5) */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-sm font-bold text-slate-800">
              Wake-up mission
            </Text>
            <Text className="text-xs font-bold text-slate-400">
              {draft.missions.length}/5
            </Text>
          </View>

          {/* Slots */}
          <View className="flex-row justify-between">
            {/* Slot 1: Math */}
            <Pressable
              onPress={() => toggleMission('math')}
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                draft.missions.includes('math')
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {draft.missions.includes('math') ? (
                <View className="items-center">
                  <Text className="text-lg">🧠</Text>
                  <Text className="text-[10px] font-bold text-amber-800">
                    Math
                  </Text>
                </View>
              ) : (
                <Text className="text-lg text-slate-400">+</Text>
              )}
            </Pressable>

            {/* Slot 2: Shake */}
            <Pressable
              onPress={() => toggleMission('shake')}
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                draft.missions.includes('shake')
                  ? 'bg-sky-50 border-sky-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {draft.missions.includes('shake') ? (
                <View className="items-center">
                  <Text className="text-lg">📱</Text>
                  <Text className="text-[10px] font-bold text-sky-800">
                    Shake
                  </Text>
                </View>
              ) : (
                <Text className="text-lg text-slate-400">+</Text>
              )}
            </Pressable>

            {/* Slot 3: QR */}
            <Pressable
              onPress={() => toggleMission('qr')}
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                draft.missions.includes('qr')
                  ? 'bg-purple-50 border-purple-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {draft.missions.includes('qr') ? (
                <View className="items-center">
                  <Text className="text-lg">📷</Text>
                  <Text className="text-[10px] font-bold text-purple-800">
                    QR
                  </Text>
                </View>
              ) : (
                <Text className="text-lg text-slate-400">+</Text>
              )}
            </Pressable>

            {/* Slot 4: Memory */}
            <Pressable
              onPress={() => toggleMission('memory')}
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                draft.missions.includes('memory')
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {draft.missions.includes('memory') ? (
                <View className="items-center">
                  <Text className="text-lg">🧩</Text>
                  <Text className="text-[10px] font-bold text-emerald-800">
                    Memory
                  </Text>
                </View>
              ) : (
                <Text className="text-lg text-slate-400">+</Text>
              )}
            </Pressable>

            {/* Slot 5: Typing */}
            <Pressable
              onPress={() => toggleMission('typing')}
              className={`h-14 w-14 items-center justify-center rounded-2xl border ${
                draft.missions.includes('typing')
                  ? 'bg-rose-50 border-rose-300'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              {draft.missions.includes('typing') ? (
                <View className="items-center">
                  <Text className="text-lg">⌨️</Text>
                  <Text className="text-[10px] font-bold text-rose-800">
                    Typing
                  </Text>
                </View>
              ) : (
                <Text className="text-lg text-slate-400">+</Text>
              )}
            </Pressable>
          </View>
        </View>

        {/* Feature Badges Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-slate-800 mr-2">
                Wake up check
              </Text>
              <View className="rounded bg-rose-100 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-rose-600">HOT</Text>
              </View>
            </View>
            <Text className="text-xs font-semibold text-slate-400">Off ›</Text>
          </View>

          <View className="flex-row items-center justify-between py-2.5">
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-slate-800 mr-2">
                Prevent power-off
              </Text>
              <View className="rounded bg-slate-100 px-1.5 py-0.5">
                <Text className="text-[9px] font-bold text-slate-500">BETA</Text>
              </View>
            </View>
            <Text className="text-xs font-semibold text-slate-400">Off ›</Text>
          </View>
        </View>

        {/* Alarm Sound Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Alarm sound
          </Text>

          {/* Sound selection row */}
          <Pressable
            onPress={() => setShowSoundPicker(prev => !prev)}
            className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-3 mb-3 border border-slate-100"
          >
            <View className="flex-row items-center">
              <View className="h-8 w-8 rounded-full bg-slate-200 items-center justify-center mr-3">
                <Text className="text-xs">▶</Text>
              </View>
              <Text className="text-sm font-bold text-slate-800">
                {SOUND_OPTIONS.find(s => s.id === draft.soundId)?.label ||
                  'Default Alarm'}
              </Text>
            </View>
            <Text className="text-xs font-bold text-slate-400">›</Text>
          </Pressable>

          {/* Sound options expansion */}
          {showSoundPicker && (
            <View className="mb-3 px-1">
              {SOUND_OPTIONS.map(opt => (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    patch({ soundId: opt.id });
                    setShowSoundPicker(false);
                  }}
                  className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-1 ${
                    draft.soundId === opt.id ? 'bg-[#E0F2FE]' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      draft.soundId === opt.id
                        ? 'font-bold text-[#0284C7]'
                        : 'font-medium text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  {draft.soundId === opt.id && (
                    <Text className="text-[#0284C7] font-bold text-xs">✓</Text>
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Volume & Vibrate Controls */}
          <View className="flex-row items-center justify-between py-2 px-1">
            <Text className="text-lg mr-2">🔊</Text>
            {/* Volume selector pills */}
            <View className="flex-1 flex-row mx-2">
              {[0.4, 0.7, 1.0].map((vol, i) => (
                <Pressable
                  key={vol}
                  onPress={() => patch({ volume: vol })}
                  className={`flex-1 py-1.5 mx-1 items-center rounded-lg ${
                    draft.volume === vol ? 'bg-[#38BDF8]' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      draft.volume === vol ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {i === 0 ? 'Low' : i === 1 ? 'Med' : 'Max'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Vibrate toggle */}
            <Pressable
              onPress={() => patch({ vibrate: !draft.vibrate })}
              className={`flex-row items-center ml-2 px-2.5 py-1.5 rounded-lg border ${
                draft.vibrate
                  ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                  : 'bg-slate-100 border-slate-100'
              }`}
            >
              <Text className="text-xs mr-1">📳</Text>
              <Text
                className={`text-xs font-bold ${
                  draft.vibrate ? 'text-[#0284C7]' : 'text-slate-400'
                }`}
              >
                {draft.vibrate ? 'ON' : 'OFF'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Custom Setting (Snooze) Card */}
        <View className="bg-white rounded-3xl p-4 mb-6 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Custom setting
          </Text>

          <Pressable
            onPress={() => setShowSnoozePicker(prev => !prev)}
            className="flex-row items-center justify-between py-2 px-1"
          >
            <Text className="text-sm font-bold text-slate-800">Snooze</Text>
            <Text className="text-xs font-bold text-slate-500">
              {draft.snooze.enabled
                ? `${draft.snooze.intervalMin} min, ${draft.snooze.maxCount} times ›`
                : 'Off ›'}
            </Text>
          </Pressable>

          {showSnoozePicker && (
            <View className="mt-3 pt-3 border-t border-slate-100">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-xs font-semibold text-slate-600">
                  Enable Snooze
                </Text>
                <Switch
                  value={draft.snooze.enabled}
                  onValueChange={enabled =>
                    patch({ snooze: { ...draft.snooze, enabled } })
                  }
                  trackColor={{ false: '#E2E8F0', true: '#38BDF8' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {draft.snooze.enabled && (
                <>
                  <Text className="text-xs font-semibold text-slate-400 mb-1.5">
                    Interval
                  </Text>
                  <View className="flex-row flex-wrap mb-3">
                    {SNOOZE_INTERVALS.map(min => (
                      <Pressable
                        key={min}
                        onPress={() =>
                          patch({
                            snooze: { ...draft.snooze, intervalMin: min },
                          })
                        }
                        className={`mr-2 mb-1.5 px-3 py-1.5 rounded-xl border ${
                          draft.snooze.intervalMin === min
                            ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            draft.snooze.intervalMin === min
                              ? 'text-[#0284C7]'
                              : 'text-slate-600'
                          }`}
                        >
                          {min}m
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text className="text-xs font-semibold text-slate-400 mb-1.5">
                    Repeat count
                  </Text>
                  <View className="flex-row flex-wrap">
                    {SNOOZE_COUNTS.map(count => (
                      <Pressable
                        key={count}
                        onPress={() =>
                          patch({
                            snooze: { ...draft.snooze, maxCount: count },
                          })
                        }
                        className={`mr-2 px-3 py-1.5 rounded-xl border ${
                          draft.snooze.maxCount === count
                            ? 'bg-[#E0F2FE] border-[#BAE6FD]'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            draft.snooze.maxCount === count
                              ? 'text-[#0284C7]'
                              : 'text-slate-600'
                          }`}
                        >
                          {count}x
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white/95 px-5 py-4 border-t border-slate-100">
        <Pressable
          onPress={save}
          className="w-full bg-[#FF385C] py-4 rounded-2xl items-center active:opacity-90 shadow-sm"
        >
          <Text className="text-white text-base font-extrabold tracking-wide">
            Save
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

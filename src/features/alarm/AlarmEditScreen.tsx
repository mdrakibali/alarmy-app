import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import { WALLPAPERS } from '@/data/wallpapers';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useToast } from '@/components/ui/AppToast';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { useAlarmStore } from './alarmStore';
import {
  MISSION_DETAILS,
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
  const insets = useAppInsets();
  const toast = useToast();
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
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const alarmBackground = useThemeStore(s => s.alarmBackground);
  const currentWallpaper =
    WALLPAPERS.find(w => w.id === (draft.wallpaper || alarmBackground)) ||
    WALLPAPERS[0];

  // Stop preview on unmount
  useEffect(() => {
    return () => {
      NativeAlarm.stopSoundPreview();
    };
  }, []);

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
  }, [draft]);

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

  const addMission = (mission: MissionType) => {
    if (draft.missions.length < 5) {
      patch({ missions: [...draft.missions, mission] });
    }
    setShowMissionModal(false);
  };

  const removeMission = (index: number) => {
    const nextMissions = draft.missions.filter((_, i) => i !== index);
    patch({ missions: nextMissions });
  };

  const toggleSoundPreview = (soundId?: string, forcePlay = false) => {
    const targetId = soundId || draft.soundId;
    if (isPlayingSound && !forcePlay) {
      NativeAlarm.stopSoundPreview().catch(() => {});
      setIsPlayingSound(false);
    } else {
      setIsPlayingSound(true);
      NativeAlarm.previewSound(targetId).catch(() => {});
      // Auto reset playing state after 3.5 seconds
      setTimeout(() => setIsPlayingSound(false), 3500);
    }
  };

  const save = () => {
    NativeAlarm.stopSoundPreview();
    const label = draft.label.trim() || 'Wake up early';
    const next = { ...draft, label };
    if (existingId && existing) {
      updateAlarm(existingId, next);
      toast.showToast({
        title: 'Alarm Updated! ⏰',
        message: `${label} scheduled for ${countdownText.toLowerCase()}`,
        type: 'success',
        icon: '⏰',
      });
    } else {
      addAlarm(next);
      toast.showToast({
        title: 'Alarm Scheduled! ⏰',
        message: `${label} set for ${countdownText.toLowerCase()}`,
        type: 'success',
        icon: '⏰',
      });
    }
    navigation.goBack();
  };

  const confirmDelete = () => {
    if (!existingId) return;
    setShowDeleteModal(true);
  };

  const handleDelete = () => {
    if (!existingId) return;
    removeAlarm(existingId);
    setShowDeleteModal(false);
    toast.showToast({
      title: 'Alarm Deleted',
      message: 'This alarm was removed from your schedule.',
      icon: '🗑️',
      type: 'info',
    });
    navigation.goBack();
  };

  const bottomInset = insets.bottom + 8;

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Top Navigation Bar with Safe Area */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="flex-row items-center justify-between px-5 pb-3 bg-white border-b border-slate-100"
      >
        <Pressable
          onPress={() => {
            NativeAlarm.stopSoundPreview();
            navigation.goBack();
          }}
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
          <View className="w-[30px]" />
        )}
      </View>

      <ScrollView
        className="flex-1"
        nestedScrollEnabled={true}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 24,
        }}
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

        {/* Custom Wheel / Drum Time Picker */}
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

          {/* 5 Slots */}
          <View className="flex-row justify-between">
            {Array.from({ length: 5 }).map((_, slotIndex) => {
              const missionKey = draft.missions[slotIndex];
              const details = missionKey ? MISSION_DETAILS[missionKey] : null;

              if (details) {
                return (
                  <Pressable
                    key={slotIndex}
                    onPress={() => removeMission(slotIndex)}
                    className="h-14 w-14 items-center justify-center rounded-2xl bg-[#E0F2FE] border border-[#BAE6FD] relative shadow-sm"
                  >
                    <Text className="text-xl">{details.icon}</Text>
                    <Text
                      className="text-[9px] font-bold text-[#0284C7] mt-0.5"
                      numberOfLines={1}
                    >
                      {details.title.split(' ')[0]}
                    </Text>
                    {/* Small remove badge */}
                    <View className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 items-center justify-center">
                      <Text className="text-white text-[9px] font-black leading-none">
                        ✕
                      </Text>
                    </View>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={slotIndex}
                  onPress={() => setShowMissionModal(true)}
                  className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-300 active:bg-slate-100"
                >
                  <Text className="text-xl font-light text-slate-400">+</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Alarm Wallpaper Section (Directly Selectable Animated GIFs) */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-1 pr-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Alarm Wallpaper (Animated GIF)
              </Text>
              <Text className="text-sm font-black text-slate-800 mt-0.5" numberOfLines={1}>
                {currentWallpaper.name} • {currentWallpaper.category}
              </Text>
            </View>
            <Pressable
              onPress={() =>
                navigation.navigate('WallpaperGallery', {
                  onSelect: (id: string) => {
                    patch({ wallpaper: id });
                    useThemeStore.getState().setBackground('alarm', id);
                  },
                })
              }
              className="py-1 px-3 rounded-full bg-rose-50 border border-rose-100 active:bg-rose-100"
            >
              <Text className="text-xs font-bold text-[#FF385C]">
                Browse All (31+) ›
              </Text>
            </Pressable>
          </View>

          {/* Quick Horizontal Carousel of Wallpapers with Live Selection */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="-mx-4 px-4 py-1"
          >
            {WALLPAPERS.slice(0, 5).map(w => {
              const isSelected = (draft.wallpaper || alarmBackground) === w.id;
              return (
                <Pressable
                  key={w.id}
                  hitSlop={8}
                  onPress={() => {
                    patch({ wallpaper: w.id });
                    useThemeStore.getState().setBackground('alarm', w.id);
                  }}
                  className={`w-24 h-36 mr-3 rounded-2xl overflow-hidden justify-between items-center relative border-2 ${
                    isSelected
                      ? 'border-[#FF385C] shadow-md bg-rose-50/10'
                      : 'border-slate-200 bg-slate-100'
                  }`}
                >
                  <Image
                    source={w.source}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                    pointerEvents="none"
                  />
                  {/* Selected Badge */}
                  <View
                    className="w-full flex-row justify-end p-1.5 z-10"
                    pointerEvents="none"
                  >
                    {isSelected && (
                      <View className="h-5 w-5 rounded-full bg-[#FF385C] items-center justify-center shadow-sm">
                        <Text className="text-white text-[9px] font-black">✓</Text>
                      </View>
                    )}
                  </View>
                  {/* Title Bar */}
                  <View
                    className="w-full py-1.5 px-1 bg-black/60 z-10"
                    pointerEvents="none"
                  >
                    <Text
                      className={`text-[10px] font-bold text-center ${
                        isSelected ? 'text-[#FF385C]' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      ♪ {w.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Alarm Sound Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Alarm sound
          </Text>

          {/* Sound selection row with Audio Preview */}
          <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-3 mb-3 border border-slate-100">
            <Pressable
              onPress={() => toggleSoundPreview()}
              className={`h-9 w-9 rounded-full items-center justify-center mr-3 active:opacity-75 ${
                isPlayingSound ? 'bg-[#FF385C]' : 'bg-[#38BDF8]'
              }`}
            >
              <Text className="text-white text-xs font-black">
                {isPlayingSound ? '■' : '▶'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowSoundPicker(prev => !prev)}
              className="flex-1 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-sm font-bold text-slate-800">
                  {SOUND_OPTIONS.find(s => s.id === draft.soundId)?.label ||
                    'Default Alarm'}
                </Text>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {isPlayingSound ? 'Playing audio preview...' : 'Tap ▶ to test sound'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-400">
                {showSoundPicker ? '▲' : '▼'}
              </Text>
            </Pressable>
          </View>

          {/* Sound options expansion */}
          {showSoundPicker && (
            <View className="mb-3 px-1">
              {SOUND_OPTIONS.map(opt => (
                <Pressable
                  key={opt.id}
                  onPress={() => {
                    patch({ soundId: opt.id });
                    setShowSoundPicker(false);
                    toggleSoundPreview(opt.id, true);
                  }}
                  className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-1 ${
                    draft.soundId === opt.id ? 'bg-[#E0F2FE]' : 'active:bg-slate-50'
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2.5">{opt.icon}</Text>
                    <Text
                      className={`text-sm ${
                        draft.soundId === opt.id
                          ? 'font-bold text-[#0284C7]'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </View>
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

      {/* Fixed Bottom Save Button with Safe Area Inset - Flex sibling so it never obscures content */}
      <View
        style={{ paddingBottom: Math.max(bottomInset, 52) }}
        className="bg-white border-t border-slate-100 shadow-lg px-5 pt-3 z-50"
      >
        <Pressable
          onPress={save}
          className="w-full bg-[#FF385C] py-4 rounded-2xl items-center active:opacity-90 shadow-sm"
        >
          <Text className="text-white text-base font-extrabold tracking-wide">
            Save
          </Text>
        </Pressable>
      </View>

      {/* Wake-up Mission Selection Modal */}
      <Modal
        visible={showMissionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMissionModal(false)}
      >
        <View className="flex-1 bg-black/45 justify-end">
          {/* Backdrop Dismiss Area */}
          <Pressable
            className="absolute inset-0"
            onPress={() => setShowMissionModal(false)}
          />

          {/* Bottom Sheet Card */}
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            className="bg-white rounded-t-3xl p-5 shadow-2xl max-h-[80%] z-10"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <View>
                <Text className="text-lg font-extrabold text-slate-900">
                  Choose Wake-up Mission
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Select a task you must complete to turn off the alarm ({draft.missions.length}/5)
                </Text>
              </View>
              <Pressable
                onPress={() => setShowMissionModal(false)}
                hitSlop={10}
                className="h-8 w-8 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
              >
                <Text className="text-base font-bold text-slate-500">✕</Text>
              </Pressable>
            </View>

            {/* Mission List */}
            <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
              {(Object.keys(MISSION_DETAILS) as MissionType[]).map(
                missionKey => {
                  const item = MISSION_DETAILS[missionKey];
                  const count = draft.missions.filter(m => m === missionKey).length;

                  return (
                    <Pressable
                      key={missionKey}
                      hitSlop={6}
                      onPress={() => addMission(missionKey)}
                      className={`flex-row items-center justify-between p-4 rounded-2xl mb-2.5 border ${
                        count > 0
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-100 shadow-sm active:bg-[#E0F2FE]'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <Text className="text-3xl mr-3">{item.icon}</Text>
                        <View className="flex-1">
                          <View className="flex-row items-center mb-0.5">
                            <Text className="text-base font-bold text-slate-900 mr-2">
                              {item.title}
                            </Text>
                            <View className="rounded bg-rose-50 px-1.5 py-0.5">
                              <Text className="text-[9px] font-black text-rose-500">
                                {item.badge}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-xs text-slate-500 font-medium leading-tight">
                            {item.desc}
                          </Text>
                        </View>
                      </View>
                      <View className="px-3.5 py-1.5 rounded-full bg-[#FF385C] shadow-xs">
                        <Text className="text-white text-xs font-black">
                          {count > 0 ? `+ Add (${count})` : '+ Add'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                },
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Custom Delete Confirmation Modal */}
      <CustomConfirmModal
        visible={showDeleteModal}
        title="Delete this alarm?"
        message="This alarm and all its scheduled wake-up missions will be permanently removed."
        icon="🗑️"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

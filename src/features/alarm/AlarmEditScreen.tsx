import React, { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAppInsets } from '@/utils/safeArea';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import { WALLPAPERS } from '@/data/wallpapers';
import { ALBA_BACKGROUNDS, findAlbaBackground } from '@/data/albaBackgrounds';
import { findMotionMedia, MOTION_MEDIA } from '@/data/motionMedia';
import { OFFLINE_PACK } from '@/data/offlinePack';
import { takeWallpaperPick } from '@/features/wallpaper/wallpaperPick';
import { NativeAlarm } from '@/native/AlarmModule';
import {
  CodeScanner,
  useCameraPermission,
} from '@/components/camera/CameraScanner';
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

const QUICK_BASE_WALLPAPERS = [
  ...ALBA_BACKGROUNDS.slice(0, 4).map(w => ({ id: w.id, name: w.name, source: w.source })),
  ...MOTION_MEDIA.slice(0, 8).map(w => ({ id: w.id, name: w.name, source: w.poster })),
];

interface QuickWallpaperCardProps {
  id: string;
  name: string;
  source: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const QuickWallpaperCard = React.memo(
  function QuickWallpaperCardComponent({
    id,
    name,
    source,
    isSelected,
    onSelect,
  }: QuickWallpaperCardProps) {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        onPress={() => onSelect(id)}
        style={{
          borderColor: isSelected ? '#1652E6' : '#E2E8F0',
          borderWidth: 2,
        }}
        className="w-24 h-36 mr-3 rounded-2xl overflow-hidden justify-between items-center relative bg-slate-100"
      >
        <Image
          pointerEvents="none"
          source={source}
          fadeDuration={0}
          resizeMethod="resize"
          resizeMode="cover"
          className="absolute inset-0 w-full h-full"
        />
        {/* Selected Badge */}
        <View pointerEvents="none" className="w-full flex-row justify-end p-1.5 z-10">
          {isSelected && (
            <View className="h-5 w-5 rounded-full bg-primary items-center justify-center">
              <Text className="text-white text-[9px] font-black">✓</Text>
            </View>
          )}
        </View>
        {/* Title Bar */}
        <View pointerEvents="none" className="w-full py-1.5 px-1 bg-black/60 z-10">
          <Text
            className={`text-[10px] font-bold text-center ${
              isSelected ? 'text-secondary' : 'text-white'
            }`}
            numberOfLines={1}
          >
            ♪ {name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected && prev.id === next.id,
);

interface MissionPickerModalProps {
  visible: boolean;
  initialMissions: MissionType[];
  insetsBottom: number;
  onClose: () => void;
  onSave: (missions: MissionType[]) => void;
}

const MissionPickerModal = React.memo(function MissionPickerModalComponent({
  visible,
  initialMissions,
  insetsBottom,
  onClose,
  onSave,
}: MissionPickerModalProps) {
  const [localMissions, setLocalMissions] = useState<MissionType[]>(initialMissions);

  useEffect(() => {
    if (visible) {
      setLocalMissions(initialMissions);
    }
  }, [visible, initialMissions]);

  const addLocalMission = (m: MissionType) => {
    setLocalMissions(curr => (curr.length < 5 ? [...curr, m] : curr));
  };

  const removeLocalMission = (m: MissionType) => {
    setLocalMissions(curr => {
      const idx = curr.lastIndexOf(m);
      if (idx === -1) return curr;
      return curr.filter((_, i) => i !== idx);
    });
  };

  const handleDone = () => {
    onSave(localMissions);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <TouchableOpacity
          activeOpacity={1}
          className="flex-1"
          onPress={onClose}
        />
        <View
          style={{
            maxHeight: '78%',
            paddingBottom: Math.max(insetsBottom, 16),
          }}
          className="bg-white rounded-t-3xl p-5"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-extrabold text-slate-900">
                Choose Wake-up Mission
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Select up to 5 missions ({localMissions.length}/5 selected)
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-9 w-9 rounded-full bg-slate-100 items-center justify-center"
            >
              <Text className="text-base font-bold text-slate-500">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mission List */}
          <ScrollView
            style={{ maxHeight: 420 }}
            className="mt-3"
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {(Object.keys(MISSION_DETAILS) as MissionType[]).map(missionKey => {
              const item = MISSION_DETAILS[missionKey];
              const count = localMissions.filter(m => m === missionKey).length;
              const canAddMore = localMissions.length < 5;

              return (
                <View
                  key={missionKey}
                  style={{
                    backgroundColor: count > 0 ? '#EEF4FF' : '#FFFFFF',
                    borderColor: count > 0 ? '#1652E6' : '#F1F5F9',
                    borderWidth: 1.5,
                  }}
                  className="flex-row items-center justify-between p-4 rounded-2xl mb-2.5"
                >
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      if (canAddMore) addLocalMission(missionKey);
                    }}
                    className="flex-row items-center flex-1 pr-2"
                  >
                    <Text className="text-3xl mr-3">{item.icon}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center mb-0.5">
                        <Text className="text-base font-bold text-slate-900 mr-2">
                          {item.title}
                        </Text>
                        <View className="rounded px-1.5 py-0.5 bg-rose-50">
                          <Text className="text-[9px] font-black text-rose-500">
                            {item.badge}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-500 font-medium leading-tight">
                        {item.desc}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    {count > 0 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => removeLocalMission(missionKey)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="h-8 w-8 rounded-full bg-slate-200 items-center justify-center mr-2"
                      >
                        <Text className="text-slate-700 font-black text-sm">−</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => {
                        if (canAddMore) addLocalMission(missionKey);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      disabled={!canAddMore}
                      className={`px-3.5 py-1.5 rounded-full ${
                        canAddMore ? 'bg-primary' : 'bg-slate-300'
                      }`}
                    >
                      <Text className="text-white text-xs font-black">
                        {count > 0 ? `+ Add (${count})` : '+ Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          {/* Fixed Bottom Action Bar */}
          <View className="pt-3 border-t border-slate-100">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleDone}
              className="w-full bg-primary py-4 rounded-2xl items-center shadow-md active:bg-primary-dark"
            >
              <Text className="text-white text-base font-black tracking-wide">
                Done ({localMissions.length}/5 Missions Added) ✓
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

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
  const [registeringCode, setRegisteringCode] = useState(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundQuery, setSoundQuery] = useState('');
  const [downloadedSounds, setDownloadedSounds] = useState<{ id: string; path: string; title: string }[]>([]);

  const alarmBackground = useThemeStore(s => s.alarmBackground);
  const selectedVisualId = draft.wallpaper || alarmBackground;
  const albaVisual = findAlbaBackground(selectedVisualId);
  const motionVisual = findMotionMedia(selectedVisualId);
  const legacyVisual = WALLPAPERS.find(w => w.id === selectedVisualId);
  const currentWallpaper = {
    name: motionVisual?.name ?? albaVisual?.name ?? legacyVisual?.name ?? 'Wallpaper',
    category: motionVisual ? (motionVisual.kind === 'gif' ? 'Motion' : 'Video') : albaVisual?.group ?? legacyVisual?.category ?? 'Nature',
  };

  // Stop preview on unmount
  useEffect(() => {
    return () => {
      setRegisteringCode(false);
      try {
        Promise.resolve(NativeAlarm.stopSoundPreview()).catch(() => {});
      } catch {}
    };
  }, []);

  useEffect(() => {
    if (!showSoundPicker) return;
    NativeAlarm.listOfflineMedia().then(rows => {
      setDownloadedSounds(
        rows
          .filter(file => /\.(wav|mp3|m4a)$/i.test(file.id))
          .map(file => ({
            id: file.id,
            path: file.path,
            title: OFFLINE_PACK.find(item => item.fileName === file.id)?.title ?? 'Downloaded sound',
          })),
      );
    });
  }, [showSoundPicker]);

  useFocusEffect(
    React.useCallback(() => {
      const picked = takeWallpaperPick();
      if (picked) {
        setDraft(current => ({ ...current, wallpaper: picked }));
      }
    }, []),
  );

  const patch = (next: Partial<Omit<Alarm, 'id'>>) =>
    setDraft(current => ({ ...current, ...next }));

  const currentSelectedWallpaper = draft.wallpaper || alarmBackground;
  const isCustomWallpaper =
    currentSelectedWallpaper?.startsWith('file://') ||
    currentSelectedWallpaper?.startsWith('content://');
  const carouselWallpapers = useMemo(() => {
    if (isCustomWallpaper) {
      return [
        {
          id: currentSelectedWallpaper,
          name: 'Custom photo',
          source: { uri: currentSelectedWallpaper },
        },
        ...QUICK_BASE_WALLPAPERS,
      ];
    }
    return QUICK_BASE_WALLPAPERS;
  }, [isCustomWallpaper, currentSelectedWallpaper]);

  const handleSelectWallpaper = React.useCallback((id: string) => {
    setDraft(current => ({ ...current, wallpaper: id }));
  }, []);

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

  const removeMission = (index: number) => {
    setDraft(current => ({
      ...current,
      missions: current.missions.filter((_, i) => i !== index),
    }));
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
    // Default repeatDays to all 7 days if none selected, so alarm always rings reliably every day (including Sat & Sun)
    const repeatDays =
      draft.repeatDays && draft.repeatDays.length > 0
        ? draft.repeatDays
        : [0, 1, 2, 3, 4, 5, 6];
    const next = { ...draft, label, repeatDays };
    if (next.wallpaper) {
      useThemeStore.getState().setBackground('alarm', next.wallpaper);
      useThemeStore.getState().setBackground('ringing', next.wallpaper);
    }
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
    <View className="flex-1 bg-background">
      {/* Top Navigation Bar with Safe Area */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="flex-row items-center justify-between px-5 pb-3 bg-white border-b border-slate-100"
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => {
            NativeAlarm.stopSoundPreview();
            navigation.goBack();
          }}
          hitSlop={10}
          className="p-1"
        >
          <Text className="text-xl font-bold text-slate-700">✕</Text>
        </TouchableOpacity>
        <Text className="text-base font-bold text-slate-900">
          Wake-up alarm
        </Text>
        {existingId ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={confirmDelete}
            hitSlop={10}
            className="p-1"
          >
            <Text className="text-sm font-semibold text-rose-500">Delete</Text>
          </TouchableOpacity>
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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={toggleDaily}
              className="flex-row items-center"
            >
              <View
                className={`h-4 w-4 rounded items-center justify-center mr-1.5 border ${
                  isDaily
                    ? 'bg-primary border-primary'
                    : 'border-slate-300 bg-white'
                }`}
              >
                {isDaily && (
                  <Text className="text-white text-[10px] font-bold">✓</Text>
                )}
              </View>
              <Text className="text-xs font-semibold text-slate-600">Daily</Text>
            </TouchableOpacity>
          </View>

          {/* 7 Days Pills */}
          <View className="flex-row justify-between">
            {DAY_LABELS.map((dayLabel, index) => {
              const selected = draft.repeatDays.includes(index);
              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.8}
                  onPress={() => toggleDay(index)}
                  className={`h-11 w-11 items-center justify-center rounded-2xl border ${
                    selected
                      ? 'bg-ice border-primary/30'
                      : 'bg-slate-100 border-slate-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-bold ${
                      selected ? 'text-primary' : 'text-slate-500'
                    }`}
                  >
                    {dayLabel}
                  </Text>
                </TouchableOpacity>
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
                  <TouchableOpacity
                    key={`slot-${slotIndex}-${missionKey}`}
                    activeOpacity={0.8}
                    onPress={() => removeMission(slotIndex)}
                    className="h-14 w-14 items-center justify-center rounded-2xl bg-ice border border-primary/20 relative shadow-sm"
                  >
                    <Text className="text-xl">{details.icon}</Text>
                    <Text
                      className="text-[9px] font-bold text-primary mt-0.5"
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
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={`slot-${slotIndex}-empty`}
                  activeOpacity={0.8}
                  onPress={() => setShowMissionModal(true)}
                  className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 border border-dashed border-slate-300"
                >
                  <Text className="text-xl font-light text-slate-400">+</Text>
                </TouchableOpacity>
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
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => navigation.navigate('WallpaperGallery', { pickForAlarm: true })}
              className="py-1 px-3 rounded-full bg-ice border border-primary/25"
            >
              <Text className="text-xs font-bold text-primary">
                Browse All
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={async () => {
              const uri = await NativeAlarm.pickLocalVideo();
              if (!uri) return;
              patch({ wallpaper: uri });
              NativeAlarm.previewVideo(uri);
            }}
            className="mb-2"
          >
            <Text className="text-xs font-bold text-subtext">Import an MP4 wallpaper</Text>
          </TouchableOpacity>

          {/* Quick Horizontal Carousel of Wallpapers with Live Selection */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="-mx-4 px-4 py-1"
          >
            {carouselWallpapers.map(w => (
              <QuickWallpaperCard
                key={w.id}
                id={w.id}
                name={w.name}
                source={w.source}
                isSelected={currentSelectedWallpaper === w.id}
                onSelect={handleSelectWallpaper}
              />
            ))}
          </ScrollView>
        </View>

        {/* Alarm Sound Card */}
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
            Alarm sound
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const uri = await NativeAlarm.pickLocalAudio();
              if (uri) patch({ soundId: uri });
            }}
            className="mb-3"
          >
            <Text className="text-sm font-bold text-primary">
              {draft.soundId.startsWith('content://') || draft.soundId.startsWith('file://')
                ? 'Custom sound selected'
                : 'Import a custom sound'}
            </Text>
          </TouchableOpacity>

          {/* Sound selection row with Audio Preview */}
          <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 p-3 mb-3 border border-slate-100">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleSoundPreview()}
              className={`h-9 w-9 rounded-full items-center justify-center mr-3 ${
                isPlayingSound ? 'bg-secondary' : 'bg-primary'
              }`}
            >
              <Text className="text-white text-xs font-black">
                {isPlayingSound ? '■' : '▶'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowSoundPicker(prev => !prev)}
              className="flex-1 flex-row items-center justify-between"
            >
              <View>
                <Text className="text-sm font-bold text-slate-800">
                  {SOUND_OPTIONS.find(s => s.id === draft.soundId)?.label ||
                    downloadedSounds.find(s => s.path === draft.soundId)?.title ||
                    (draft.soundId.startsWith('file://') ? 'Downloaded sound' : 'Default Alarm')}
                </Text>
                <Text className="text-[11px] text-slate-400 font-medium">
                  {isPlayingSound ? 'Playing audio preview...' : 'Tap ▶ to test sound'}
                </Text>
              </View>
              <Text className="text-xs font-bold text-slate-400">
                {showSoundPicker ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sound options expansion */}
          {showSoundPicker && (
            <View className="mb-3 px-1">
              <TextInput
                value={soundQuery}
                onChangeText={setSoundQuery}
                placeholder="Search sounds"
                placeholderTextColor="#556889"
                className="bg-background border border-slate-200 rounded-xl px-3 py-2 mb-2 text-sm text-navy"
              />
              {SOUND_OPTIONS.filter(opt =>
                opt.label.toLowerCase().includes(soundQuery.trim().toLowerCase()),
              ).map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.8}
                  onPress={() => {
                    patch({ soundId: opt.id });
                    setShowSoundPicker(false);
                    toggleSoundPreview(opt.id, true);
                  }}
                  className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-1 ${
                    draft.soundId === opt.id ? 'bg-ice' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <Text className="text-lg mr-2.5">{opt.icon}</Text>
                    <Text
                      className={`text-sm ${
                        draft.soundId === opt.id
                          ? 'font-bold text-primary'
                          : 'font-medium text-slate-700'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </View>
                  {draft.soundId === opt.id && (
                    <Text className="text-primary font-bold text-xs">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              {downloadedSounds
                .filter(opt => opt.title.toLowerCase().includes(soundQuery.trim().toLowerCase()))
                .map(opt => (
                  <TouchableOpacity
                    key={opt.path}
                    activeOpacity={0.8}
                    onPress={() => {
                      patch({ soundId: opt.path });
                      setShowSoundPicker(false);
                      toggleSoundPreview(opt.path, true);
                    }}
                    className={`flex-row items-center justify-between py-2.5 px-3 rounded-xl mb-1 ${
                      draft.soundId === opt.path ? 'bg-ice' : ''
                    }`}
                  >
                    <Text className="text-sm font-medium text-slate-700">{opt.title}</Text>
                    {draft.soundId === opt.path ? <Text className="text-primary font-bold text-xs">✓</Text> : null}
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Volume & Vibrate Controls */}
          <View className="flex-row items-center justify-between py-2 px-1">
            <Text className="text-lg mr-2">🔊</Text>
            {/* Volume selector pills */}
            <View className="flex-1 flex-row mx-2">
              {[0.4, 0.7, 1.0].map((vol, i) => (
                <TouchableOpacity
                  key={vol}
                  activeOpacity={0.8}
                  onPress={() => patch({ volume: vol })}
                  className={`flex-1 py-1.5 mx-1 items-center rounded-lg ${
                    draft.volume === vol ? 'bg-primary' : 'bg-slate-100'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      draft.volume === vol ? 'text-white' : 'text-slate-500'
                    }`}
                  >
                    {i === 0 ? 'Low' : i === 1 ? 'Med' : 'Max'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Vibrate toggle */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => patch({ vibrate: !draft.vibrate })}
              className={`flex-row items-center ml-2 px-2.5 py-1.5 rounded-lg border ${
                draft.vibrate
                  ? 'bg-ice border-primary/30'
                  : 'bg-slate-100 border-slate-100'
              }`}
            >
              <Text className="text-xs mr-1">📳</Text>
              <Text
                className={`text-xs font-bold ${
                  draft.vibrate ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {draft.vibrate ? 'ON' : 'OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100">
          <Text className="text-sm font-bold text-navy">Gradual volume</Text>
          <TouchableOpacity
            onPress={() => patch({ gentleWakeup: !(draft.gentleWakeup ?? true) })}
            className="mt-2 self-start px-3 py-2 rounded-full bg-background border border-primary/40"
          >
            <Text className="text-xs font-bold text-navy">
              {(draft.gentleWakeup ?? true) ? 'Crescendo on' : 'Crescendo off'}
            </Text>
          </TouchableOpacity>
          <Text className="text-sm font-bold text-navy mt-4">Wake Up Check</Text>
          <Text className="text-xs text-subtext mt-1">
            After you dismiss, Alba rings again to see if you are still up.
          </Text>
          <View className="flex-row mt-2">
            {[0, 3, 5, 10].map(mins => (
              <TouchableOpacity
                key={mins}
                onPress={() => patch({ wakeUpCheckMin: mins })}
                className={`mr-2 px-3 py-2 rounded-full border ${
                  (draft.wakeUpCheckMin ?? 0) === mins ? 'bg-navy' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${(draft.wakeUpCheckMin ?? 0) === mins ? 'text-white' : 'text-navy'}`}>
                  {mins === 0 ? 'Off' : `${mins} min`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Setting (Snooze) Card */}
        <View className="bg-white rounded-3xl p-4 mb-6 border border-slate-100 shadow-sm">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Custom setting
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSnoozePicker(prev => !prev)}
            className="flex-row items-center justify-between py-2 px-1"
          >
            <Text className="text-sm font-bold text-slate-800">Snooze</Text>
            <Text className="text-xs font-bold text-slate-500">
              {draft.snooze.enabled
                ? `${draft.snooze.intervalMin} min, ${draft.snooze.maxCount} times ›`
                : 'Off ›'}
            </Text>
          </TouchableOpacity>

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
                  trackColor={{ false: '#E2E8F0', true: '#1652E6' }}
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
                      <TouchableOpacity
                        key={min}
                        activeOpacity={0.8}
                        onPress={() =>
                          patch({
                            snooze: { ...draft.snooze, intervalMin: min },
                          })
                        }
                        className={`mr-2 mb-1.5 px-3 py-1.5 rounded-xl border ${
                          draft.snooze.intervalMin === min
                            ? 'bg-ice border-primary/20'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            draft.snooze.intervalMin === min
                              ? 'text-primary'
                              : 'text-slate-600'
                          }`}
                        >
                          {min}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text className="text-xs font-semibold text-slate-400 mb-1.5">
                    Repeat count
                  </Text>
                  <View className="flex-row flex-wrap">
                    {SNOOZE_COUNTS.map(count => (
                      <TouchableOpacity
                        key={count}
                        activeOpacity={0.8}
                        onPress={() =>
                          patch({
                            snooze: { ...draft.snooze, maxCount: count },
                          })
                        }
                        className={`mr-2 px-3 py-1.5 rounded-xl border ${
                          draft.snooze.maxCount === count
                            ? 'bg-ice border-primary/20'
                            : 'bg-slate-50 border-slate-100'
                        }`}
                      >
                        <Text
                          className={`text-xs font-bold ${
                            draft.snooze.maxCount === count
                              ? 'text-primary'
                              : 'text-slate-600'
                          }`}
                        >
                          {count}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
            </View>
          )}
        </View>

      {/* Mission capture setup */}
      {draft.missions.includes('photo') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100">
          <TouchableOpacity
            onPress={async () => {
              const shot = await NativeAlarm.openCameraMission({ mode: 'photo' });
              if (shot?.path) {
                patch({ photoReferencePath: shot.path });
              }
            }}
          >
            <Text className="text-sm font-bold text-navy">
              {draft.photoReferencePath ? 'Reference photo saved. Tap to replace.' : 'Register reference photo'}
            </Text>
          </TouchableOpacity>
          <View className="flex-row mt-3">
            {[65, 72, 85].map(value => (
              <TouchableOpacity
                key={value}
                onPress={() => patch({ photoMatchThreshold: value })}
                className={`mr-2 px-3 py-2 rounded-full border ${
                  (draft.photoMatchThreshold ?? 72) === value ? 'bg-navy' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${(draft.photoMatchThreshold ?? 72) === value ? 'text-white' : 'text-navy'}`}>
                  Match {value}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}
      {draft.missions.includes('qr') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100">
          <Text className="text-sm font-bold text-navy">
            {draft.barcodeValue ? `Registered code: ${draft.barcodeValue}` : 'No QR or barcode registered'}
          </Text>
          <Text className="text-xs text-subtext mt-1">
            Scan the real code during setup. Typed text is not saved.
          </Text>
          <TouchableOpacity
            onPress={async () => {
              if (!hasPermission) {
                const granted = await requestPermission();
                if (!granted) return;
              }
              setRegisteringCode(true);
            }}
            className="mt-3 bg-primary py-3 rounded-2xl items-center active:bg-primary-dark"
          >
            <Text className="text-white font-bold">Scan code to register</Text>
          </TouchableOpacity>
          {registeringCode ? (
            <View className="h-56 mt-3 rounded-2xl overflow-hidden">
              <CodeScanner
                style={{ width: '100%', height: '100%' }}
                isActive={registeringCode}
                barcodeFormats={['qr-code', 'ean-13', 'ean-8', 'code-128', 'upc-a']}
                onBarcodeScanned={(codes: any[]) => {
                  const value = codes.find((code: any) => code.rawValue)?.rawValue;
                  if (!value) return;
                  patch({ barcodeValue: value.trim() });
                  setRegisteringCode(false);
                }}
                onError={() => setRegisteringCode(false)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
      {draft.missions.includes('step') || draft.missions.includes('squat') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100">
          <Text className="text-sm font-bold text-navy mb-2">Mission targets</Text>
          {draft.missions.includes('step') ? (
            <View className="flex-row mb-2">
              {[20, 30, 50].map(value => (
                <TouchableOpacity key={value} onPress={() => patch({ stepTarget: value })} className="mr-2 px-3 py-2 rounded-full bg-background border border-primary/40">
                  <Text className="text-xs font-bold text-navy">{value} steps</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
          {draft.missions.includes('squat') ? (
            <View className="flex-row">
              {[5, 10, 15].map(value => (
                <TouchableOpacity key={value} onPress={() => patch({ squatTarget: value })} className="mr-2 px-3 py-2 rounded-full bg-background border border-primary/40">
                  <Text className="text-xs font-bold text-navy">{value} squats</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
      </ScrollView>

      <View
        style={{ paddingBottom: Math.max(bottomInset, 52) }}
        className="bg-white border-t border-slate-100 shadow-lg px-5 pt-3"
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={save}
          className="w-full bg-primary py-4 rounded-2xl items-center shadow-md active:bg-primary-dark"
        >
          <Text className="text-white text-base font-extrabold tracking-wide">
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <MissionPickerModal
        visible={showMissionModal}
        initialMissions={draft.missions}
        insetsBottom={insets.bottom}
        onClose={() => setShowMissionModal(false)}
        onSave={missions => patch({ missions })}
      />

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

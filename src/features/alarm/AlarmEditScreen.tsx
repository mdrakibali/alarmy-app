/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  BackHandler,
  Image,
  Modal,
  PermissionsAndroid,
  Platform,
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
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useToast } from '@/components/ui/AppToast';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { useAlarmStore } from './alarmStore';
import { Check, ChevronRight, Play, Plus, Square, Trash2, X } from 'lucide-react-native';
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
  ...ALBA_BACKGROUNDS.map(w => ({ id: w.id, name: w.name, source: w.source })),
  ...MOTION_MEDIA.map(w => ({ id: w.id, name: w.name, source: w.poster })),
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

  const addLocalMission = async (m: MissionType) => {
    if (Platform.OS === 'android') {
      if (['squat', 'photo', 'qr', 'blink'].includes(m)) {
        const hasCam = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCam) {
          const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
            title: 'Camera Access Needed',
            message: 'Alba needs camera permission to verify this mission.',
            buttonPositive: 'Allow',
          });
          if (res !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }
      } else if (m === 'step' && Platform.Version >= 29) {
        const hasAct = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION);
        if (!hasAct) {
          const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION, {
            title: 'Motion Sensor Permission',
            message: 'Alba needs physical activity access to count steps.',
            buttonPositive: 'Allow',
          });
          if (res !== PermissionsAndroid.RESULTS.GRANTED) {
            return;
          }
        }
      }
    }
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
              <X size={18} color="#64748B" />
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

  const initialDraft = useMemo<Omit<Alarm, 'id'>>(
    () => (existing ? { ...existing } : blankAlarm()),
    [existing],
  );
  const [draft, setDraft] = useState<Omit<Alarm, 'id'>>(initialDraft);

  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [showMissionModal, setShowMissionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const [soundQuery, setSoundQuery] = useState('');
  const [downloadedSounds, setDownloadedSounds] = useState<{ id: string; path: string; title: string }[]>([]);

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(initialDraft);
  }, [draft, initialDraft]);

  const handleCancel = () => {
    if (isDirty) {
      setShowDiscardModal(true);
    } else {
      NativeAlarm.stopSoundPreview().catch(() => {});
      navigation.goBack();
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (isDirty) {
        setShowDiscardModal(true);
        return true;
      }
      NativeAlarm.stopSoundPreview().catch(() => {});
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isDirty]);

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
    NativeAlarm.stopSoundPreview().catch(() => {});

    // Ensure system permissions on Android
    if (Platform.OS === 'android') {
      NativeAlarm.canScheduleExactAlarms().then(ok => {
        if (!ok) NativeAlarm.openExactAlarmSettings();
      });
      if (Platform.Version >= 33) {
        PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).then(hasNotif => {
          if (!hasNotif) {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS).catch(() => {});
          }
        });
      }
    }

    // Mission requirement validation
    if (draft.missions.includes('photo') && !draft.photoReferencePath) {
      toast.showToast({
        title: 'Reference Photo Required 📸',
        message: 'Please take and register a reference photo before saving.',
        type: 'error',
        icon: '📸',
      });
      return;
    }

    if (draft.missions.includes('qr') && !draft.barcodeValue?.trim()) {
      toast.showToast({
        title: 'Barcode / QR Required 📷',
        message: 'Please scan or enter a registered code before saving.',
        type: 'error',
        icon: '📷',
      });
      return;
    }

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
          onPress={handleCancel}
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

          {/* Toggle: Use Video Sound */}
          <View className="flex-row items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-slate-800">
                Play Wallpaper Video Audio
              </Text>
              <Text className="text-xs text-slate-400">
                Use video soundtrack instead of standard ringtone
              </Text>
            </View>
            <Switch
              value={Boolean(draft.useVideoAudio)}
              onValueChange={v => patch({ useVideoAudio: v })}
              trackColor={{ false: '#E2E8F0', true: '#1652E6' }}
              thumbColor="#FFFFFF"
            />
          </View>

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
              {isPlayingSound ? (
                <Square size={13} color="#FFFFFF" fill="#FFFFFF" />
              ) : (
                <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
              )}
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

          <View className="h-[1px] bg-slate-100 my-4" />
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-bold text-slate-800">Bedtime Wind-down Reminder</Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                Receive a notification 30 mins before sleep to ensure 7.5+ hours of rest.
              </Text>
            </View>
            <Switch
              value={Boolean(draft.bedtimeReminder)}
              onValueChange={v => patch({ bedtimeReminder: v })}
              trackColor={{ false: '#E2E8F0', true: '#1652E6' }}
              thumbColor="#FFFFFF"
            />
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

      {/* Math Mission Configuration */}
      {draft.missions.includes('math') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-1">🧠 Math Mission Settings</Text>
          <Text className="text-xs text-subtext mb-2">Configure problem count and difficulty</Text>
          <Text className="text-xs font-semibold text-subtext mb-1">Number of problems:</Text>
          <View className="flex-row flex-wrap mb-3">
            {[1, 3, 5, 10].map(count => {
              const isSel = (draft.mathCount ?? 3) === count;
              return (
                <TouchableOpacity
                  key={count}
                  onPress={() => patch({ mathCount: count })}
                  className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                    isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                  } border`}
                >
                  <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                    {count} {count === 1 ? 'problem' : 'problems'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text className="text-xs font-semibold text-subtext mb-1">Difficulty:</Text>
          <View className="flex-row flex-wrap">
            {(['easy', 'normal', 'hard'] as const).map(diff => {
              const isSel = (draft.mathDifficulty ?? 'normal') === diff;
              return (
                <TouchableOpacity
                  key={diff}
                  onPress={() => patch({ mathDifficulty: diff })}
                  className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                    isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                  } border`}
                >
                  <Text className={`text-xs font-bold capitalize ${isSel ? 'text-white' : 'text-navy'}`}>
                    {diff}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Memory Mission Configuration */}
      {draft.missions.includes('memory') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-1">🧩 Memory Game Settings</Text>
          <Text className="text-xs text-subtext mb-2">Select how many card pairs to match</Text>
          <View className="flex-row flex-wrap">
            {[4, 6, 8, 12].map(pairs => {
              const isSel = (draft.memoryPairs ?? 6) === pairs;
              return (
                <TouchableOpacity
                  key={pairs}
                  onPress={() => patch({ memoryPairs: pairs })}
                  className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                    isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                  } border`}
                >
                  <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                    {pairs} pairs ({pairs * 2} cards)
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Typing Mission Configuration */}
      {draft.missions.includes('typing') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-1">⌨️ Typing Mission Settings</Text>
          <Text className="text-xs text-subtext mb-2">Choose or type an affirmation phrase</Text>
          <TextInput
            value={draft.typingPhrase ?? 'I am wide awake and ready to conquer the day.'}
            onChangeText={text => patch({ typingPhrase: text })}
            placeholder="Type your morning affirmation"
            placeholderTextColor="#94A3B8"
            multiline
            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm text-slate-800 font-medium mb-2.5"
          />
          <View className="flex-row flex-wrap">
            {[
              'I am wide awake and ready to conquer the day.',
              'Rise and shine with positive energy and focus.',
              'Today will be a successful, peaceful, and productive day.',
            ].map((preset, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => patch({ typingPhrase: preset })}
                className="mr-2 mb-1.5 px-3 py-1 rounded-full bg-ice border border-primary/30"
              >
                <Text className="text-xs text-primary font-semibold">Preset {idx + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* Mission capture setup */}
      {draft.missions.includes('photo') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-1">📸 Photo Mission Setup</Text>
          <Text className="text-xs text-subtext mb-3">
            Register a clear photo of an object (sink, coffee mug, desk) you must photograph to stop the alarm.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              const shot = await NativeAlarm.openCameraMission({ mode: 'register_photo' });
              if (shot?.path) {
                patch({ photoReferencePath: shot.path });
                toast.showToast({
                  title: 'Photo Registered! 📸',
                  message: 'Reference photo captured successfully.',
                  type: 'success',
                  icon: '📸',
                });
              }
            }}
            className="bg-primary py-3 px-4 rounded-2xl items-center active:bg-primary-dark mb-3"
          >
            <Text className="text-white font-bold text-sm">
              {draft.photoReferencePath ? '✓ Replace Reference Photo' : '📸 Take Reference Photo'}
            </Text>
          </TouchableOpacity>
          {draft.photoReferencePath ? (
            <Text className="text-xs font-semibold text-emerald-600 mb-2">
              ✓ Registered: {draft.photoReferencePath.split('/').pop()}
            </Text>
          ) : (
            <Text className="text-xs font-semibold text-rose-500 mb-2">
              ⚠️ Photo required before saving this alarm
            </Text>
          )}
          <Text className="text-xs font-semibold text-subtext mb-1">Match sensitivity:</Text>
          <View className="flex-row">
            {[65, 72, 85].map(value => (
              <TouchableOpacity
                key={value}
                onPress={() => patch({ photoMatchThreshold: value })}
                className={`mr-2 px-3 py-1.5 rounded-full border ${
                  (draft.photoMatchThreshold ?? 72) === value ? 'bg-navy' : 'bg-white border-slate-200'
                }`}
              >
                <Text className={`text-xs font-bold ${(draft.photoMatchThreshold ?? 72) === value ? 'text-white' : 'text-navy'}`}>
                  {value}% {value === 72 ? '(Recommended)' : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : null}

      {/* QR / Barcode Mission Setup */}
      {draft.missions.includes('qr') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-1">📷 QR / Barcode Registration</Text>
          <Text className="text-xs text-subtext mb-3">
            Scan a real barcode (toothpaste, shampoo, book) or enter the code manually.
          </Text>
          <View className="flex-row items-center mb-3">
            <TextInput
              value={draft.barcodeValue ?? ''}
              onChangeText={val => patch({ barcodeValue: val })}
              placeholder="Barcode number or QR code text"
              placeholderTextColor="#94A3B8"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-mono mr-2"
            />
            {draft.barcodeValue ? (
              <TouchableOpacity
                onPress={() => patch({ barcodeValue: '' })}
                className="h-9 w-9 bg-slate-100 rounded-full items-center justify-center mr-1"
              >
                <Text className="text-xs text-slate-500 font-bold">✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              const res = await NativeAlarm.openCameraMission({ mode: 'register_barcode' });
              if (res?.value) {
                patch({ barcodeValue: res.value.trim() });
                toast.showToast({
                  title: 'Barcode Registered! ✓',
                  message: `Code: ${res.value.trim()}`,
                  type: 'success',
                  icon: '📷',
                });
              }
            }}
            className="bg-primary py-3 px-4 rounded-2xl items-center active:bg-primary-dark"
          >
            <Text className="text-white font-bold text-sm">📸 Scan with Camera Scanner</Text>
          </TouchableOpacity>
          {draft.barcodeValue ? (
            <Text className="text-xs font-semibold text-emerald-600 mt-2">
              ✓ Registered code: {draft.barcodeValue}
            </Text>
          ) : (
            <Text className="text-xs font-semibold text-rose-500 mt-2">
              ⚠️ Code required before saving this alarm
            </Text>
          )}
        </View>
      ) : null}

      {draft.missions.includes('step') || draft.missions.includes('squat') || draft.missions.includes('shake') || draft.missions.includes('flip') || draft.missions.includes('blink') ? (
        <View className="bg-white rounded-3xl p-4 mb-4 border border-slate-100 shadow-xs">
          <Text className="text-sm font-bold text-navy mb-2">Mission targets (Quick testing & settings)</Text>
          {draft.missions.includes('flip') ? (
            <View className="mb-2">
              <Text className="text-xs font-semibold text-subtext mb-1">Flip target:</Text>
              <View className="flex-row flex-wrap">
                {[3, 5, 10, 15].map(value => {
                  const isSel = (draft.flipTarget ?? 5) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => patch({ flipTarget: value })}
                      className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                        isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                      } border`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                        {value} flips {value <= 5 ? '⚡' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          {draft.missions.includes('blink') ? (
            <View className="mb-2">
              <Text className="text-xs font-semibold text-subtext mb-1">Blink target:</Text>
              <View className="flex-row flex-wrap">
                {[3, 5, 8, 12].map(value => {
                  const isSel = (draft.blinkTarget ?? 5) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => patch({ blinkTarget: value })}
                      className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                        isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                      } border`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                        {value} blinks {value <= 5 ? '⚡' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          {draft.missions.includes('step') ? (
            <View className="mb-2">
              <Text className="text-xs font-semibold text-subtext mb-1">Step target:</Text>
              <View className="flex-row flex-wrap">
                {[5, 10, 20, 30].map(value => {
                  const isSel = (draft.stepTarget ?? 5) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => patch({ stepTarget: value })}
                      className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                        isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                      } border`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                        {value} steps {value <= 5 ? '⚡' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          {draft.missions.includes('squat') ? (
            <View className="mb-2">
              <Text className="text-xs font-semibold text-subtext mb-1">Squat target:</Text>
              <View className="flex-row flex-wrap">
                {[2, 3, 5, 10].map(value => {
                  const isSel = (draft.squatTarget ?? 3) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => patch({ squatTarget: value })}
                      className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                        isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                      } border`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                        {value} squats {value <= 3 ? '⚡' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
          {draft.missions.includes('shake') ? (
            <View>
              <Text className="text-xs font-semibold text-subtext mb-1">Shake target:</Text>
              <View className="flex-row flex-wrap">
                {[5, 10, 20, 30].map(value => {
                  const isSel = (draft.shakeTarget ?? 5) === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      onPress={() => patch({ shakeTarget: value })}
                      className={`mr-2 mb-1 px-3 py-1.5 rounded-full ${
                        isSel ? 'bg-primary border-primary' : 'bg-background border-primary/30'
                      } border`}
                    >
                      <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-navy'}`}>
                        {value} shakes {value <= 5 ? '⚡' : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
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

      {/* Custom Discard Confirmation Modal */}
      <CustomConfirmModal
        visible={showDiscardModal}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them and go back?"
        icon="⚠️"
        confirmText="Discard"
        cancelText="Keep Editing"
        isDestructive
        onConfirm={() => {
          setShowDiscardModal(false);
          NativeAlarm.stopSoundPreview().catch(() => {});
          navigation.goBack();
        }}
        onCancel={() => setShowDiscardModal(false)}
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

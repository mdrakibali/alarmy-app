/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppInsets } from '@/utils/safeArea';
import { Screen } from '@/components/ui/Screen';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from './alarmStore';
import { formatTime, sortAlarms } from './format';
import { nextOccurrence } from './nextOccurrence';
import type { Alarm } from './types';
import { DaypartHeader } from './DaypartHeader';
import { QuickAlarmModal } from './QuickAlarmModal';
import { HabitAlarmModal } from './HabitAlarmModal';
import { useToast } from '@/components/ui/AppToast';

import {
  AlarmClock,
  Calendar,
  ChevronRight,
  Copy,
  Edit3,
  Moon,
  MoreVertical,
  Plus,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react-native';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function AlarmListScreen() {
  const insets = useAppInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const toast = useToast();
  const alarms = useAlarmStore(s => s.alarms);
  const toggleAlarm = useAlarmStore(s => s.toggleAlarm);
  const clearSnooze = useAlarmStore(s => s.clearSnooze);
  const removeAlarm = useAlarmStore(s => s.removeAlarm);
  const addAlarm = useAlarmStore(s => s.addAlarm);
  const sorted = sortAlarms(alarms);

  const [nowTimestamp, setNowTimestamp] = useState(Date.now());
  const [snoozeSeconds, setSnoozeSeconds] = useState<number>(0);
  const [activeSnoozeAlarm, setActiveSnoozeAlarm] = useState<any>(null);

  // FAB Popup State (Matching Alarmy design)
  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [showHabitModal, setShowHabitModal] = useState(false);

  // Card Options Modal
  const [selectedAlarmForMenu, setSelectedAlarmForMenu] = useState<Alarm | null>(null);

  useEffect(() => {
    const checkSnooze = () => {
      const now = Date.now();
      const snoozed = alarms.find(a => (a.snoozedUntil ?? 0) > now);
      if (snoozed && snoozed.snoozedUntil) {
        setActiveSnoozeAlarm(snoozed);
        setSnoozeSeconds(Math.max(0, Math.ceil((snoozed.snoozedUntil - now) / 1000)));
      } else {
        NativeAlarm.getActiveSnoozedAlarm().then(nativeSnoozed => {
          if (nativeSnoozed && nativeSnoozed.triggerTimeMs > now) {
            setActiveSnoozeAlarm({
              ...nativeSnoozed,
              snooze: { intervalMin: nativeSnoozed.snoozeIntervalMin },
            });
            setSnoozeSeconds(Math.max(0, Math.ceil((nativeSnoozed.triggerTimeMs - now) / 1000)));
          } else {
            setActiveSnoozeAlarm(null);
            setSnoozeSeconds(0);
          }
        });
      }
    };

    checkSnooze();
    const interval = setInterval(checkSnooze, 1000);
    return () => clearInterval(interval);
  }, [alarms]);

  const snoozeMin = Math.floor(snoozeSeconds / 60);
  const snoozeSec = snoozeSeconds % 60;
  const formattedSnoozeCountdown = `${String(snoozeMin).padStart(2, '0')}:${String(snoozeSec).padStart(2, '0')}`;

  useEffect(() => {
    const timer = setInterval(() => setNowTimestamp(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute countdown to earliest upcoming enabled alarm
  const nextAlarmCountdown = useMemo(() => {
    const enabledAlarms = alarms.filter(a => a.enabled);
    if (enabledAlarms.length === 0) return null;

    const now = new Date(nowTimestamp);
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

  const handleDuplicate = (alarm: Alarm) => {
    const copy = { ...alarm };
    delete (copy as Partial<Alarm>).id;
    addAlarm({
      ...copy,
      label: `${alarm.label || 'Alarm'} (Copy)`,
      enabled: true,
    });
    setSelectedAlarmForMenu(null);
    toast.showToast({
      title: 'Alarm Duplicated',
      message: 'A copy of this alarm was added to your schedule.',
      icon: '📋',
      type: 'success',
    });
  };

  const handleDelete = (alarmId: string) => {
    removeAlarm(alarmId);
    setSelectedAlarmForMenu(null);
    toast.showToast({
      title: 'Alarm Deleted',
      message: 'The alarm was removed from your schedule.',
      icon: '🗑️',
      type: 'info',
    });
  };

  return (
    <Screen padded={false}>
      <View className="flex-1 bg-background relative">
        <DaypartHeader now={new Date(nowTimestamp)} countdown={nextAlarmCountdown} />

        {/* Promo banner matching Alarmy */}
        <Pressable
          onPress={() => navigation.navigate('AlarmEdit')}
          className="mx-4 mb-3 flex-row items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-slate-100"
        >
          <View className="flex-row items-center flex-1">
            <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-primary">
              <Sparkles size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text className="text-xs font-semibold text-slate-400">
                Overslept AGAIN?
              </Text>
              <Text className="text-sm font-bold text-navy">
                Try our new wake-up missions
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#94A3B8" />
        </Pressable>

        {/* Active Snooze Floating Banner */}
        {activeSnoozeAlarm && snoozeSeconds > 0 && (
          <View className="mx-4 mb-3 p-4 rounded-3xl bg-indigo-950 border border-indigo-400/40 shadow-xl">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="h-9 w-9 rounded-full bg-amber-400/20 items-center justify-center mr-2.5 border border-amber-400/30">
                  <Moon size={18} color="#FBBF24" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="text-amber-400 text-xs font-black uppercase tracking-wider mr-2">
                      Snooze Active
                    </Text>
                    <View className="h-2 w-2 rounded-full bg-amber-400" />
                  </View>
                  <Text className="text-white text-sm font-bold mt-0.5" numberOfLines={1}>
                    {activeSnoozeAlarm.label || 'Morning Alarm'}
                  </Text>
                </View>
              </View>

              <View className="bg-black/60 px-3.5 py-1.5 rounded-2xl border border-white/20 items-center justify-center">
                <Text className="text-amber-300 font-black text-xl tracking-widest">
                  {formattedSnoozeCountdown}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SnoozeCountdown', {
                    alarmId: activeSnoozeAlarm.id,
                    intervalMin: activeSnoozeAlarm.snooze?.intervalMin || 5,
                    wallpaper: activeSnoozeAlarm.wallpaper,
                  });
                }}
                className="flex-1 bg-primary py-2.5 rounded-xl items-center shadow-xs active:bg-primary-dark mr-2"
              >
                <Text className="text-white font-extrabold text-xs">
                  View Full Screen ⏱️
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  clearSnooze(activeSnoozeAlarm.id);
                  await NativeAlarm.cancelAlarm(activeSnoozeAlarm.id);
                  setActiveSnoozeAlarm(null);
                }}
                className="bg-danger/90 px-4 py-2.5 rounded-xl items-center active:bg-danger"
              >
                <Text className="text-white font-extrabold text-xs">
                  Dismiss ✕
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {nextAlarmCountdown ? (
          <View className="mx-4 mb-3 p-3.5 rounded-2xl bg-ice border border-primary/20 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-2">
              <View className="h-8 w-8 rounded-full bg-primary/10 items-center justify-center mr-2.5">
                <Text className="text-sm">⏰</Text>
              </View>
              <View>
                <Text className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Upcoming Alarm</Text>
                <Text className="text-sm font-black text-slate-900">
                  Rings in {nextAlarmCountdown}
                </Text>
              </View>
            </View>
            <View className="bg-primary px-2.5 py-1 rounded-full">
              <Text className="text-white text-[10px] font-black uppercase tracking-wider">Active</Text>
            </View>
          </View>
        ) : (
          <View className="px-5 py-2">
            <Text className="text-xs font-bold text-slate-400">No active alarms set</Text>
          </View>
        )}

        {/* Alarms List */}
        <FlatList
          data={sorted}
          keyExtractor={item => item.id}
          // eslint-disable-next-line react-native/no-inline-styles
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 160 + insets.bottom,
          }}
          ListEmptyComponent={
            <EmptyState onAdd={() => setIsFabMenuOpen(true)} />
          }
          renderItem={({ item }) => (
            <AlarmCard
              alarm={item}
              onPress={() => navigation.navigate('AlarmEdit', { id: item.id })}
              onToggle={() => toggleAlarm(item.id)}
              onOpenMenu={() => setSelectedAlarmForMenu(item)}
            />
          )}
        />

        {/* Backdrop for FAB Menu */}
        {isFabMenuOpen && (
          <Pressable
            style={{ zIndex: 40 }}
            onPress={() => setIsFabMenuOpen(false)}
            className="absolute inset-0 bg-black/65"
          />
        )}

        {/* Floating Action Menu Popups (Matching Alarmy Screenshot 1.12) */}
        {isFabMenuOpen && (
          <View
            style={{ bottom: 156 + insets.bottom, right: 20, zIndex: 50 }}
            className="absolute items-end"
          >
            {/* Top Card: Habit alarm & Quick alarm */}
            <View className="bg-white rounded-3xl w-52 shadow-2xl mb-3 overflow-hidden border border-slate-100/80">
              {/* Habit Alarm Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsFabMenuOpen(false);
                  setShowHabitModal(true);
                }}
                className="flex-row items-center px-4 py-3.5 active:bg-slate-50"
              >
                <View className="w-8 h-8 rounded-xl bg-purple-50 items-center justify-center mr-3">
                  <Calendar size={18} color="#9333EA" />
                </View>
                <Text className="text-slate-900 text-base font-bold">
                  Habit alarm
                </Text>
              </TouchableOpacity>

              <View className="h-[1px] bg-slate-100 mx-4" />

              {/* Quick Alarm Option */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  setIsFabMenuOpen(false);
                  setShowQuickModal(true);
                }}
                className="flex-row items-center px-4 py-3.5 active:bg-slate-50"
              >
                <View className="w-8 h-8 rounded-xl bg-blue-50 items-center justify-center mr-3">
                  <Zap size={18} color="#2563EB" />
                </View>
                <Text className="text-slate-900 text-base font-bold">
                  Quick alarm
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Card: Alarm */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setIsFabMenuOpen(false);
                navigation.navigate('AlarmEdit');
              }}
              className="bg-white rounded-3xl w-52 px-4 py-3.5 flex-row items-center shadow-2xl border border-slate-100/80 active:bg-slate-50"
            >
              <View className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center mr-3">
                <AlarmClock size={18} color="#E11D48" />
              </View>
              <Text className="text-slate-900 text-base font-bold">
                Alarm
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Floating Action Button (FAB) */}
        <View
          style={{ bottom: 76 + insets.bottom, right: 20, zIndex: 50 }}
          className="absolute"
        >
          <TouchableOpacity
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isFabMenuOpen ? 'Close add menu' : 'Add alarm'}
            onPress={() => setIsFabMenuOpen(!isFabMenuOpen)}
            className="h-16 w-16 items-center justify-center rounded-full bg-[#FF2D55] shadow-2xl active:scale-95"
          >
            {isFabMenuOpen ? (
              <X size={26} color="#FFFFFF" strokeWidth={2.4} />
            ) : (
              <Plus size={28} color="#FFFFFF" strokeWidth={2.4} />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Alarm Bottom Sheet */}
        <QuickAlarmModal
          visible={showQuickModal}
          onClose={() => setShowQuickModal(false)}
        />

        {/* Habit Alarm Modal */}
        <HabitAlarmModal
          visible={showHabitModal}
          onClose={() => setShowHabitModal(false)}
        />

        {/* Card Options Modal (Three dots) */}
        {selectedAlarmForMenu && (
          <Modal
            visible={Boolean(selectedAlarmForMenu)}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedAlarmForMenu(null)}
          >
            <Pressable
              onPress={() => setSelectedAlarmForMenu(null)}
              className="flex-1 bg-black/60 justify-end"
            >
              <View
                style={{ paddingBottom: Math.max(insets.bottom + 16, 24) }}
                className="bg-white rounded-t-3xl p-6"
              >
                <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-2">
                  <Text className="text-lg font-black text-slate-900">
                    {selectedAlarmForMenu.label || 'Alarm Options'}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedAlarmForMenu(null)}>
                    <X size={20} color="#94A3B8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const id = selectedAlarmForMenu.id;
                    setSelectedAlarmForMenu(null);
                    navigation.navigate('AlarmEdit', { id });
                  }}
                  className="flex-row items-center py-3.5 border-b border-slate-50"
                >
                  <View className="w-8 items-center mr-2">
                    <Edit3 size={18} color="#08173E" />
                  </View>
                  <Text className="text-slate-800 text-base font-bold">Edit Alarm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDuplicate(selectedAlarmForMenu)}
                  className="flex-row items-center py-3.5 border-b border-slate-50"
                >
                  <View className="w-8 items-center mr-2">
                    <Copy size={18} color="#08173E" />
                  </View>
                  <Text className="text-slate-800 text-base font-bold">Duplicate Alarm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDelete(selectedAlarmForMenu.id)}
                  className="flex-row items-center py-3.5"
                >
                  <View className="w-8 items-center mr-2">
                    <Trash2 size={18} color="#EF4444" />
                  </View>
                  <Text className="text-red-500 text-base font-bold">Delete Alarm</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Modal>
        )}
      </View>
    </Screen>
  );
}

function AlarmCard({
  alarm,
  onPress,
  onToggle,
  onOpenMenu,
}: {
  alarm: Alarm;
  onPress: () => void;
  onToggle: () => void;
  onOpenMenu: () => void;
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

  const badgeIcon = alarm.habitIcon
    ? alarm.habitIcon
    : alarm.isQuickAlarm
    ? '⚡'
    : '⏰';

  return (
    <Pressable
      onPress={onPress}
      className="mb-3.5 rounded-3xl bg-white p-5 shadow-sm border border-slate-100/90 active:bg-slate-50"
    >
      {/* Top Row: S M T W T F S and Switch */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {alarm.isQuickAlarm ? (
            <View className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/50">
              <Text className="text-[10px] font-black text-blue-600 uppercase tracking-wider">
                Quick Alarm ({alarm.quickMinutes || 15}m)
              </Text>
            </View>
          ) : alarm.repeatDays.length === 0 ? (
            <View className="px-2 py-0.5 rounded-md bg-slate-100">
              <Text className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Once
              </Text>
            </View>
          ) : (
            DAY_LABELS.map((dayLabel, index) => {
              const isSelected = alarm.repeatDays.includes(index);
              return (
                <Text
                  key={index}
                  className={`mr-3 text-xs font-bold ${
                    isSelected ? 'text-navy font-extrabold' : 'text-slate-300'
                  }`}
                >
                  {dayLabel}
                </Text>
              );
            })
          )}
        </View>

        {/* Custom Alba Switch */}
        <Switch
          value={alarm.enabled}
          onValueChange={onToggle}
          trackColor={{ false: '#E2E8F0', true: '#1652E6' }}
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
          <View className="ml-3 rounded-lg bg-slate-100 px-2 py-0.5 flex-row items-center">
            <Text className="text-xs mr-1">{missionIcon}</Text>
            <Text className="text-[10px] font-black text-slate-600">
              {alarm.missions.length}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Row: Label & Menu */}
      <View className="flex-row items-center justify-between pt-1">
        <View className="flex-row items-center flex-1 pr-2">
          <Text className="mr-1.5 text-sm">{badgeIcon}</Text>
          <Text
            className="text-xs font-semibold text-slate-500"
            numberOfLines={1}
          >
            {alarm.label || 'Wake up early'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={e => {
            e.stopPropagation();
            onOpenMenu();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-1"
        >
          <MoreVertical size={16} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <View className="items-center justify-center py-16 px-6">
      <View className="h-20 w-20 rounded-3xl bg-blue-50 border border-blue-100 items-center justify-center mb-4 shadow-xs">
        <AlarmClock size={36} color="#1652E6" strokeWidth={1.8} />
      </View>
      <Text className="text-xl font-black text-slate-900">No active alarms</Text>
      <Text className="mb-6 mt-1.5 text-center text-xs text-slate-500 max-w-xs leading-relaxed font-medium">
        Set your first alarm with wake-up missions to guarantee you get out of bed on time.
      </Text>
      <Pressable
        onPress={onAdd}
        className="rounded-2xl bg-primary px-7 py-3.5 shadow-md active:bg-primary-dark"
      >
        <Text className="text-sm font-extrabold text-white tracking-wide">+ Set First Alarm</Text>
      </Pressable>
    </View>
  );
}

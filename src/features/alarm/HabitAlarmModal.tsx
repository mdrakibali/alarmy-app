import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '@/components/ui/AppToast';
import { useAppInsets } from '@/utils/safeArea';
import { useAlarmStore } from './alarmStore';
import { WheelTimePicker } from '@/components/ui/WheelTimePicker';
import type { MissionType } from './types';
import { MISSION_DETAILS, SOUND_OPTIONS } from './format';
import { NativeAlarm } from '@/native/AlarmModule';

interface Props {
  visible: boolean;
  onClose: () => void;
}

interface HabitTemplate {
  id: string;
  icon: string;
  title: string;
  defaultHour: number;
  defaultMinute: number;
  suggestedMissions: MissionType[];
}

const HABIT_TEMPLATES: HabitTemplate[] = [
  {
    id: 'wake_up',
    icon: '🌅',
    title: 'Wake up early',
    defaultHour: 6,
    defaultMinute: 30,
    suggestedMissions: ['math'],
  },
  {
    id: 'medication',
    icon: '💊',
    title: 'Take medication',
    defaultHour: 9,
    defaultMinute: 0,
    suggestedMissions: [],
  },
  {
    id: 'stretch',
    icon: '🏋️‍♂️',
    title: '5-min stretch',
    defaultHour: 7,
    defaultMinute: 15,
    suggestedMissions: ['squat'],
  },
  {
    id: 'drink_water',
    icon: '💧',
    title: 'Drink water',
    defaultHour: 8,
    defaultMinute: 0,
    suggestedMissions: [],
  },
  {
    id: 'prayers',
    icon: '🙏',
    title: 'Say prayers',
    defaultHour: 5,
    defaultMinute: 30,
    suggestedMissions: [],
  },
  {
    id: 'meditation',
    icon: '🧘',
    title: '1-min meditation',
    defaultHour: 7,
    defaultMinute: 0,
    suggestedMissions: [],
  },
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function HabitAlarmModal({ visible, onClose }: Props) {
  const insets = useAppInsets();
  const toast = useToast();
  const addAlarm = useAlarmStore(s => s.addAlarm);

  const [step, setStep] = useState<'pick_habit' | 'configure'>('pick_habit');
  const [selectedHabit, setSelectedHabit] = useState<HabitTemplate>(HABIT_TEMPLATES[0]);
  const [customGoal, setCustomGoal] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  // Configuration state
  const [hour, setHour] = useState(6);
  const [minute, setMinute] = useState(30);
  const [repeatDays, setRepeatDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // Daily by default
  const [missions, setMissions] = useState<MissionType[]>([]);
  const [soundId, setSoundId] = useState('alarm_gentle_morning');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const soundName = useMemo(() => {
    return SOUND_OPTIONS.find(s => s.id === soundId)?.label || 'Gentle Morning';
  }, [soundId]);

  const handleSelectTemplate = (template: HabitTemplate) => {
    setSelectedHabit(template);
    setIsCustom(false);
    setHour(template.defaultHour);
    setMinute(template.defaultMinute);
    setMissions(template.suggestedMissions);
    setStep('configure');
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
    setHour(7);
    setMinute(0);
    setMissions([]);
    setStep('configure');
  };

  const toggleDay = (dayIndex: number) => {
    setRepeatDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex].sort(),
    );
  };

  const toggleDaily = () => {
    if (repeatDays.length === 7) {
      setRepeatDays([1, 2, 3, 4, 5]); // Weekdays
    } else {
      setRepeatDays([0, 1, 2, 3, 4, 5, 6]); // All days
    }
  };

  const handleSave = () => {
    const finalIcon = isCustom ? '🎯' : selectedHabit.icon;
    const finalTitle = isCustom ? (customGoal.trim() || 'My Daily Habit') : selectedHabit.title;

    addAlarm({
      hour,
      minute,
      label: finalTitle,
      repeatDays,
      enabled: true,
      soundId,
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions,
      isHabitAlarm: true,
      habitIcon: finalIcon,
      habitGoal: finalTitle,
    });

    const period = hour >= 12 ? 'PM' : 'AM';
    const displayH = hour % 12 || 12;
    const displayM = String(minute).padStart(2, '0');

    toast.showToast({
      title: `${finalIcon} Habit Alarm Created!`,
      message: `${finalTitle} set for ${displayH}:${displayM} ${period}`,
      type: 'success',
      icon: finalIcon,
    });

    // Reset and close
    setStep('pick_habit');
    onClose();
  };

  const handleClose = () => {
    setStep('pick_habit');
    onClose();
  };

  const period = hour >= 12 ? 'PM' : 'AM';
  const displayH = hour % 12 || 12;
  const displayM = String(minute).padStart(2, '0');
  const formattedTime = `${displayH}:${displayM} ${period}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/75">
        <Pressable className="flex-1" onPress={handleClose} />
        <View
          style={{
            maxHeight: '90%',
            paddingBottom: Math.max(insets.bottom + 16, 24),
          }}
          className="bg-[#121214] rounded-t-3xl border-t border-white/10"
        >
          {step === 'pick_habit' ? (
            /* Step 1: Pick Habit (Matching 1.15-habit-allarm.jpeg) */
            <View className="p-6">
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4">
                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <Text className="text-white text-sm font-bold">✕</Text>
                </TouchableOpacity>

                <View className="flex-row items-center">
                  <View className="h-1.5 w-12 rounded-full bg-primary mr-2" />
                  <View className="h-1.5 w-12 rounded-full bg-white/20" />
                  <Text className="text-slate-400 text-xs font-bold ml-2">1/2</Text>
                </View>

                <TouchableOpacity onPress={handleSelectCustom}>
                  <Text className="text-slate-400 text-sm font-bold">Skip</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-white text-2xl font-black mt-2 mb-6">
                What habit do you want to build?
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[460px]">
                {HABIT_TEMPLATES.map(template => (
                  <TouchableOpacity
                    key={template.id}
                    activeOpacity={0.8}
                    onPress={() => handleSelectTemplate(template)}
                    className="flex-row items-center bg-[#1E1E22] p-4 rounded-2xl mb-3 border border-white/5 active:bg-[#28282E]"
                  >
                    <View className="w-12 h-12 rounded-2xl bg-white/10 items-center justify-center mr-4">
                      <Text className="text-2xl">{template.icon}</Text>
                    </View>
                    <Text className="text-white text-base font-bold flex-1">
                      {template.title}
                    </Text>
                    <Text className="text-slate-500 text-lg font-bold">›</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleSelectCustom}
                  className="flex-row items-center bg-[#1E1E22] p-4 rounded-2xl mb-6 border border-white/5 active:bg-[#28282E]"
                >
                  <View className="w-12 h-12 rounded-2xl bg-cyan-500/20 items-center justify-center mr-4">
                    <Text className="text-cyan-400 text-xl font-black">＋</Text>
                  </View>
                  <Text className="text-cyan-400 text-base font-bold flex-1">
                    Enter my own
                  </Text>
                  <Text className="text-cyan-400 text-lg font-bold">›</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : (
            /* Step 2: Configure Habit Alarm (Matching 1.15.1-create-habit-allarm.jpeg) */
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 24 }}
            >
              {/* Header */}
              <View className="flex-row items-center justify-between pb-4">
                <TouchableOpacity
                  onPress={() => setStep('pick_habit')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <Text className="text-white text-sm font-bold">‹</Text>
                </TouchableOpacity>

                <Text className="text-white text-lg font-black">Habit alarm</Text>

                <TouchableOpacity
                  onPress={handleClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
                >
                  <Text className="text-white/70 text-sm font-bold">✕</Text>
                </TouchableOpacity>
              </View>

              {/* Habit Goal Title */}
              <View className="flex-row items-center bg-[#1E1E22] px-4 py-3.5 rounded-2xl mb-5 border border-white/10">
                <Text className="text-2xl mr-3">
                  {isCustom ? '🎯' : selectedHabit.icon}
                </Text>
                {isCustom ? (
                  <TextInput
                    value={customGoal}
                    onChangeText={setCustomGoal}
                    placeholder="Enter your habit goal"
                    placeholderTextColor="#64748B"
                    className="flex-1 text-white font-bold text-base py-0"
                  />
                ) : (
                  <Text className="flex-1 text-white font-bold text-base">
                    {selectedHabit.title}
                  </Text>
                )}
                <Text className="text-slate-500 text-sm">✎</Text>
              </View>

              {/* Alarm Time Card */}
              <View className="mb-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Alarm time
                  </Text>
                  <Text className="text-slate-500 text-xs">1/4</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  className="bg-[#1E1E22] p-5 rounded-2xl border border-white/5 items-center justify-between flex-row"
                >
                  <Text className="text-white text-3xl font-black tracking-tight">
                    {formattedTime}
                  </Text>
                  <Text className="text-cyan-400 text-sm font-bold">
                    {showTimePicker ? 'Done ✓' : 'Change ⏱️'}
                  </Text>
                </TouchableOpacity>

                {showTimePicker && (
                  <View className="bg-[#1E1E22] mt-2 p-3 rounded-2xl items-center border border-white/10">
                    <WheelTimePicker
                      hour={hour}
                      minute={minute}
                      onChange={(h, m) => {
                        setHour(h);
                        setMinute(m);
                      }}
                    />
                  </View>
                )}
              </View>

              {/* Repeat Days Selection */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                    Repeat Schedule
                  </Text>
                  <TouchableOpacity
                    onPress={toggleDaily}
                    className="flex-row items-center"
                  >
                    <View
                      className={`h-4 w-4 rounded items-center justify-center mr-1.5 ${
                        repeatDays.length === 7 ? 'bg-cyan-400' : 'border border-slate-500'
                      }`}
                    >
                      {repeatDays.length === 7 && (
                        <Text className="text-black text-[10px] font-black">✓</Text>
                      )}
                    </View>
                    <Text className="text-slate-300 text-xs font-bold">Daily</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row justify-between">
                  {DAY_LABELS.map((dayLabel, index) => {
                    const isSelected = repeatDays.includes(index);
                    return (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={0.8}
                        onPress={() => toggleDay(index)}
                        className={`w-11 h-11 rounded-2xl items-center justify-center border ${
                          isSelected
                            ? 'bg-cyan-950 border-cyan-400'
                            : 'bg-[#1E1E22] border-white/5'
                        }`}
                      >
                        <Text
                          className={`text-sm font-extrabold ${
                            isSelected ? 'text-cyan-400' : 'text-slate-500'
                          }`}
                        >
                          {dayLabel}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Wake-Up Missions Row */}
              <View className="bg-[#1E1E22] p-5 rounded-2xl mb-6 border border-white/5">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white text-sm font-bold">Wake-up mission</Text>
                  <Text className="text-slate-500 text-xs font-bold">
                    {missions.length}/5
                  </Text>
                </View>

                <View className="flex-row space-x-2.5">
                  {(['squat', 'math', 'step', 'shake'] as MissionType[]).map(mType => {
                    const isSelected = missions.includes(mType);
                    const item = MISSION_DETAILS[mType];
                    return (
                      <TouchableOpacity
                        key={mType}
                        onPress={() => {
                          setMissions(prev =>
                            prev.includes(mType)
                              ? prev.filter(m => m !== mType)
                              : [...prev, mType],
                          );
                        }}
                        className={`flex-1 py-3 items-center justify-center rounded-2xl border ${
                          isSelected
                            ? 'bg-primary/20 border-primary'
                            : 'bg-black/30 border-white/5'
                        }`}
                      >
                        <Text className="text-2xl mb-1">{item.icon}</Text>
                        <Text
                          className={`text-[10px] font-bold ${
                            isSelected ? 'text-primary' : 'text-slate-400'
                          }`}
                        >
                          {item.title.split(' ')[0]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Alarm Sound Selector */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowSoundPicker(!showSoundPicker)}
                className="flex-row items-center justify-between py-3.5 px-4 rounded-2xl bg-[#1E1E22] mb-4 border border-white/5"
              >
                <Text className="text-white text-sm font-semibold">Alarm Sound</Text>
                <View className="flex-row items-center">
                  <Text className="text-slate-400 text-sm font-medium mr-1.5">{soundName}</Text>
                  <Text className="text-slate-500 font-bold">›</Text>
                </View>
              </TouchableOpacity>

              {showSoundPicker && (
                <View className="bg-[#1E1E22] rounded-2xl p-2 mb-4 border border-white/10 max-h-44">
                  {SOUND_OPTIONS.slice(0, 6).map(s => (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => {
                        setSoundId(s.id);
                        setShowSoundPicker(false);
                        NativeAlarm.previewSound(s.id).catch(() => {});
                      }}
                      className={`p-3 rounded-xl flex-row items-center justify-between ${
                        soundId === s.id ? 'bg-primary/20' : ''
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          soundId === s.id ? 'text-primary font-bold' : 'text-white'
                        }`}
                      >
                        {s.icon} {s.label}
                      </Text>
                      {soundId === s.id && (
                        <Text className="text-primary text-xs font-black">✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSave}
                className="w-full bg-[#FF2D55] py-4 rounded-3xl items-center shadow-lg active:bg-[#E0264A] mb-4"
              >
                <Text className="text-white text-base font-black tracking-wider">
                  Save
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}


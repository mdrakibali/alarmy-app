import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useToast } from '@/components/ui/AppToast';
import { SOUND_OPTIONS } from './format';
import { useAlarmStore } from './alarmStore';
import { useAppInsets } from '@/utils/safeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PRESET_MINUTES = [
  { label: '1 min', value: 1 },
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '1 hours', value: 60 },
];

export function QuickAlarmModal({ visible, onClose }: Props) {
  const insets = useAppInsets();
  const toast = useToast();
  const addAlarm = useAlarmStore(s => s.addAlarm);

  const [minutes, setMinutes] = useState(15);
  const [selectedSoundId, setSelectedSoundId] = useState('loud_siren');
  const [volume, setVolume] = useState(1.0);
  const [vibrate, setVibrate] = useState(true);
  const [showSoundPicker, setShowSoundPicker] = useState(false);

  const addPreset = (val: number) => {
    setMinutes(prev => prev + val);
  };

  const resetMinutes = () => {
    setMinutes(0);
  };

  const calculatedRingTime = useMemo(() => {
    const mins = minutes > 0 ? minutes : 1;
    const target = new Date(Date.now() + mins * 60 * 1000);
    const h = target.getHours();
    const m = target.getMinutes();
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    const displayM = String(m).padStart(2, '0');
    return `${displayH}:${displayM} ${period}`;
  }, [minutes]);

  const soundName = useMemo(() => {
    return SOUND_OPTIONS.find(s => s.id === selectedSoundId)?.label || 'Orkney';
  }, [selectedSoundId]);

  const handleSave = () => {
    const finalMinutes = minutes > 0 ? minutes : 1;
    const target = new Date(Date.now() + finalMinutes * 60 * 1000);
    const hour = target.getHours();
    const minute = target.getMinutes();

    addAlarm({
      hour,
      minute,
      label: `Quick alarm (${finalMinutes}m)`,
      repeatDays: [],
      enabled: true,
      soundId: selectedSoundId,
      volume,
      vibrate,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [],
      isQuickAlarm: true,
      quickMinutes: finalMinutes,
    });

    toast.showToast({
      title: '⚡ Quick Alarm Set!',
      message: `Rings in ${finalMinutes} min at ${calculatedRingTime}`,
      type: 'success',
      icon: '⚡',
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          style={{
            paddingBottom: Math.max(insets.bottom + 16, 28),
          }}
          className="bg-[#1C1C1E] rounded-t-3xl p-6 border-t border-white/10"
        >
          {/* Top Header */}
          <View className="flex-row items-center justify-between pb-3">
            <View className="w-8" />
            <Text className="text-white text-lg font-black tracking-wide">
              Quick alarm
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="w-8 h-8 rounded-full bg-white/10 items-center justify-center"
            >
              <Text className="text-white/70 text-sm font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Center Countdown Display */}
          <View className="items-center justify-center py-6">
            <View className="flex-row items-baseline justify-center">
              <Text className="text-white text-6xl font-black tracking-tight">
                +{minutes}
                <Text className="text-4xl text-white/80 font-bold">m</Text>
              </Text>
              <TouchableOpacity
                onPress={resetMinutes}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="ml-3 p-2 rounded-full bg-white/10"
              >
                <Text className="text-white/80 text-xl font-bold">↻</Text>
              </TouchableOpacity>
            </View>

            <Text className="text-slate-400 text-sm font-semibold mt-2">
              Ring at {calculatedRingTime}
            </Text>
          </View>

          {/* 3x2 Preset Buttons Grid */}
          <View className="flex-row flex-wrap justify-between mb-6">
            {PRESET_MINUTES.map(preset => (
              <TouchableOpacity
                key={preset.value}
                activeOpacity={0.75}
                onPress={() => addPreset(preset.value)}
                className="w-[31%] bg-[#2C2C2E] py-4 rounded-2xl items-center mb-3 active:bg-[#3A3A3C] border border-white/5"
              >
                <Text className="text-white font-bold text-sm">
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Alarm Sound Row */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setShowSoundPicker(!showSoundPicker)}
            className="flex-row items-center justify-between py-3.5 px-4 rounded-2xl bg-[#2C2C2E] mb-4 border border-white/5"
          >
            <Text className="text-white/90 text-sm font-semibold">
              Alarm sound
            </Text>
            <View className="flex-row items-center">
              <Text className="text-slate-400 text-sm font-medium mr-1.5">
                {soundName}
              </Text>
              <Text className="text-slate-500 font-bold">›</Text>
            </View>
          </TouchableOpacity>

          {/* Sound Picker Dropdown */}
          {showSoundPicker && (
            <View className="bg-[#2C2C2E] rounded-2xl p-2 mb-4 border border-white/10 max-h-44">
              {SOUND_OPTIONS.slice(0, 5).map(s => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => {
                    setSelectedSoundId(s.id);
                    setShowSoundPicker(false);
                  }}
                  className={`p-3 rounded-xl flex-row items-center justify-between ${
                    selectedSoundId === s.id ? 'bg-primary/20' : ''
                  }`}
                >
                  <Text
                    className={`text-sm ${
                      selectedSoundId === s.id
                        ? 'text-primary font-bold'
                        : 'text-white'
                    }`}
                  >
                    ♪ {s.label}
                  </Text>
                  {selectedSoundId === s.id && (
                    <Text className="text-primary text-xs font-black">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Volume and Vibrate Control */}
          <View className="flex-row items-center justify-between py-2 px-1 mb-6">
            <View className="flex-row items-center flex-1 mr-4">
              <Text className="text-lg mr-3">🔊</Text>
              <View className="flex-1 flex-row items-center space-x-1.5">
                {[0.2, 0.4, 0.6, 0.8, 1.0].map(v => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setVolume(v)}
                    className={`flex-1 h-2 rounded-full ${
                      volume >= v ? 'bg-white' : 'bg-white/20'
                    }`}
                  />
                ))}
              </View>
            </View>

            <View className="h-6 w-[1px] bg-white/20 mx-2" />

            <View className="flex-row items-center pl-2">
              <Text className="text-lg mr-2">📳</Text>
              <Switch
                value={vibrate}
                onValueChange={setVibrate}
                trackColor={{ false: '#3A3A3C', true: '#30D158' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            className="w-full bg-[#FF2D55] py-4 rounded-3xl items-center shadow-lg active:bg-[#E0264A]"
          >
            <Text className="text-white text-base font-black tracking-wider">
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

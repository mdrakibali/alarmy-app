import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react-native';
import { NativeAlarm } from '@/native/AlarmModule';
import { useActiveMissionStore } from '@/storage/activeMissionStore';

interface EmergencyDismissModalProps {
  visible: boolean;
  onClose: () => void;
  onDismissSuccess: () => void;
  targetTaps?: number;
}

export function EmergencyDismissModal({
  visible,
  onClose,
  onDismissSuccess,
  targetTaps = 50,
}: EmergencyDismissModalProps) {
  const [tapCount, setTapCount] = useState(0);

  const handleTap = () => {
    NativeAlarm.triggerHapticTick();
    const nextCount = tapCount + 1;
    setTapCount(nextCount);

    if (nextCount >= targetTaps) {
      useActiveMissionStore.getState().clearSession();
      Promise.resolve(NativeAlarm.stopAlarm()).catch(() => {});
      onDismissSuccess();
    }
  };

  const handleModalClose = () => {
    setTapCount(0);
    onClose();
  };

  const remaining = Math.max(0, targetTaps - tapCount);
  const progressPercent = Math.min(100, Math.round((tapCount / targetTaps) * 100));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View className="flex-1 bg-black/85 items-center justify-center p-5">
        <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-row items-center flex-1">
              <View className="h-9 w-9 rounded-xl bg-amber-50 items-center justify-center mr-2.5">
                <ShieldAlert size={20} color="#D97706" />
              </View>
              <Text className="text-lg font-black text-slate-900">
                Emergency Unlock
              </Text>
            </View>
            <TouchableOpacity onPress={handleModalClose} className="p-1">
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <Text className="text-xs text-slate-500 mt-3 leading-relaxed font-medium">
            Cannot solve your mission? Tap the button below <Text className="font-black text-slate-800">{targetTaps} times</Text> to force-stop the alarm. This ensures you stay awake without getting permanently trapped.
          </Text>

          {/* Progress Bar */}
          <View className="w-full bg-slate-100 h-2.5 rounded-full mt-4 mb-2 overflow-hidden">
            <View
              style={{ width: `${progressPercent}%` }}
              className="bg-amber-500 h-full rounded-full"
            />
          </View>
          <Text className="text-right text-[11px] font-extrabold text-amber-600 mb-4">
            {remaining} taps remaining ({progressPercent}%)
          </Text>

          {/* Big Tap Button */}
          <Pressable
            onPress={handleTap}
            className="w-full py-6 rounded-2xl bg-amber-500 items-center justify-center shadow-lg active:scale-95 active:bg-amber-600"
          >
            <Text className="text-white text-xl font-black tracking-wide">
              {remaining === 0 ? 'ALARM STOPPED! ✓' : `TAP HERE (${remaining})`}
            </Text>
            <Text className="text-white/80 text-[10px] font-bold uppercase mt-1 tracking-widest">
              Fast tapping wakes your brain
            </Text>
          </Pressable>

          {/* Cancel */}
          <TouchableOpacity
            onPress={handleModalClose}
            className="mt-3.5 py-2 items-center"
          >
            <Text className="text-xs font-bold text-slate-400">
              Return to Mission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

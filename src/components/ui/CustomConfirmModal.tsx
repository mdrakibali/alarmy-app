import React from 'react';
import {
  Modal,
  Pressable,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CustomConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CustomConfirmModal({
  visible,
  title,
  message,
  icon = '🔔',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: CustomConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <TouchableWithoutFeedback>
            <View className="w-full max-w-[340px] bg-white rounded-3xl p-6 items-center shadow-2xl">
              {/* Icon Bubble */}
              <View
                className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${
                  isDestructive ? 'bg-red-100' : 'bg-sky-100'
                }`}
              >
                <Text className="text-2xl">{icon}</Text>
              </View>

              {/* Title & Message */}
              <Text className="text-lg font-extrabold text-slate-900 text-center mb-2">
                {title}
              </Text>
              {Boolean(message) && (
                <Text className="text-xs font-medium text-slate-500 text-center leading-relaxed mb-5 px-2">
                  {message}
                </Text>
              )}

              {/* Buttons */}
              <View className="flex-row w-full gap-3">
                {Boolean(cancelText) && (
                  <Pressable
                    onPress={onCancel}
                    className="flex-1 py-3.5 rounded-2xl items-center justify-center bg-slate-100 active:bg-slate-200"
                  >
                    <Text className="text-sm font-bold text-slate-500">
                      {cancelText}
                    </Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={onConfirm}
                  className={`flex-1 py-3.5 rounded-2xl items-center justify-center active:opacity-90 shadow-sm ${
                    isDestructive ? 'bg-rose-500' : 'bg-[#1652E6]'
                  } ${!cancelText ? 'flex-1' : ''}`}
                >
                  <Text className="text-sm font-extrabold text-white">
                    {confirmText}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

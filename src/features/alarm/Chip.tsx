import React from 'react';
import { Pressable, Text } from 'react-native';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`mr-2 mb-2 rounded-2xl px-4 py-2.5 border ${
        selected
          ? 'bg-[#E0F2FE] border-[#BAE6FD]'
          : 'bg-slate-100 border-slate-100 active:bg-slate-200'
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? 'text-[#0284C7]' : 'text-slate-600'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

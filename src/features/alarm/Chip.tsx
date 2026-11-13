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
      className={`mr-2 mb-2 rounded-full px-3.5 py-2 ${
        selected ? 'bg-amber-500' : 'bg-slate-800'
      }`}
    >
      <Text
        className={`text-sm font-medium ${
          selected ? 'text-slate-950' : 'text-slate-200'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

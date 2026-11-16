import React from 'react';
import { Pressable, Text } from 'react-native';

type Variant = 'primary' | 'danger' | 'ghost';

const styles: Record<Variant, { box: string; label: string }> = {
  primary: { box: 'bg-[#1652E6]', label: 'text-white' },
  danger: { box: 'bg-rose-50', label: 'text-rose-600' },
  ghost: { box: 'bg-slate-100', label: 'text-slate-700' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
}) {
  const tone = styles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={`items-center justify-center rounded-2xl px-5 py-4 ${tone.box} ${
        disabled ? 'opacity-40' : 'active:opacity-85'
      }`}
    >
      <Text className={`text-base font-bold ${tone.label}`}>{label}</Text>
    </Pressable>
  );
}

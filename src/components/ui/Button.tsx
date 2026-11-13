import React from 'react';
import { Pressable, Text } from 'react-native';

type Variant = 'primary' | 'danger' | 'ghost';

const styles: Record<Variant, { box: string; label: string }> = {
  primary: { box: 'bg-amber-500', label: 'text-slate-950' },
  danger: { box: 'bg-red-500/15', label: 'text-red-400' },
  ghost: { box: 'bg-slate-800', label: 'text-slate-100' },
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
      className={`items-center rounded-2xl px-4 py-4 ${tone.box} ${
        disabled ? 'opacity-40' : 'active:opacity-80'
      }`}
    >
      <Text className={`text-base font-semibold ${tone.label}`}>{label}</Text>
    </Pressable>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </Text>
      <View className="overflow-hidden rounded-2xl bg-slate-900">{children}</View>
    </View>
  );
}

export function Row({
  children,
  last = false,
}: {
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center justify-between px-4 py-3.5 ${
        last ? '' : 'border-b border-slate-800'
      }`}
    >
      {children}
    </View>
  );
}

import React from 'react';
import { Text, View } from 'react-native';

export function Section({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      {title ? (
        <Text className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-3xl bg-white border border-slate-100 shadow-sm">
        {children}
      </View>
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
        last ? '' : 'border-b border-slate-100'
      }`}
    >
      {children}
    </View>
  );
}

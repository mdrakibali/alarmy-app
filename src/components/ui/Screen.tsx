import React from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <SafeAreaView
      edges={['top']}
      className={`flex-1 bg-slate-950 ${padded ? 'px-5' : ''}`}
    >
      {children}
    </SafeAreaView>
  );
}

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold text-white">{title}</Text>
        <Text className="mt-2 text-sm text-slate-400">Coming later</Text>
      </View>
    </Screen>
  );
}

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
      style={{ flex: 1, backgroundColor: '#F5F6F8' }}
    >
      <View style={{ flex: 1, paddingHorizontal: padded ? 16 : 0 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-semibold text-slate-800">{title}</Text>
        <Text className="mt-2 text-sm text-slate-400">Coming soon</Text>
      </View>
    </Screen>
  );
}

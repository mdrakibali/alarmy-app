import React from 'react';
import { View } from 'react-native';
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
      className="flex-1 bg-background"
    >
      <View className={`flex-1 ${padded ? 'px-4' : 'px-0'}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}

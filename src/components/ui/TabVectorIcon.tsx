import React from 'react';
import { View } from 'react-native';
import { AlarmClock, Moon, Sun, BarChart3, Settings } from 'lucide-react-native';

export type TabIconType = 'alarm' | 'sleep' | 'morning' | 'report' | 'settings';

interface TabVectorIconProps {
  name: TabIconType;
  focused: boolean;
  color?: string;
  size?: number;
  hasBadge?: boolean;
}

export function TabVectorIcon({
  name,
  focused,
  color,
  size = 22,
  hasBadge = false,
}: TabVectorIconProps) {
  const activeColor = color || (focused ? '#08173E' : '#94A3B8');
  const strokeWidth = focused ? 2.3 : 1.8;

  return (
    <View className="w-6 h-6 items-center justify-center relative">
      {name === 'alarm' && (
        <AlarmClock size={size} color={activeColor} strokeWidth={strokeWidth} />
      )}
      {name === 'sleep' && (
        <Moon size={size} color={activeColor} strokeWidth={strokeWidth} />
      )}
      {name === 'morning' && (
        <Sun size={size} color={activeColor} strokeWidth={strokeWidth} />
      )}
      {name === 'report' && (
        <BarChart3 size={size} color={activeColor} strokeWidth={strokeWidth} />
      )}
      {name === 'settings' && (
        <Settings size={size} color={activeColor} strokeWidth={strokeWidth} />
      )}

      {hasBadge && (
        <View className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
      )}
    </View>
  );
}

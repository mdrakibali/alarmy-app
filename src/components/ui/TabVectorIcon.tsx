import React from 'react';
import { View } from 'react-native';

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
  hasBadge = false,
}: TabVectorIconProps) {
  return (
    <View className="w-6 h-6 items-center justify-center relative">
      {name === 'alarm' && <AlarmIcon focused={focused} />}
      {name === 'sleep' && <SleepIcon focused={focused} />}
      {name === 'morning' && <MorningIcon focused={focused} />}
      {name === 'report' && <ReportIcon focused={focused} />}
      {name === 'settings' && <SettingsIcon focused={focused} />}

      {hasBadge && (
        <View className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-secondary border border-white" />
      )}
    </View>
  );
}

function AlarmIcon({ focused }: { focused: boolean }) {
  const bg = focused ? 'bg-slate-900' : 'bg-slate-400';
  const border = focused ? 'border-slate-900' : 'border-slate-400';

  return (
    <View className="w-[22px] h-[22px] items-center justify-center relative">
      {/* Top bells */}
      <View
        className={`absolute w-1.5 h-[3px] rounded-sm -rotate-45 top-0 left-0.5 ${bg}`}
      />
      <View
        className={`absolute w-1.5 h-[3px] rounded-sm rotate-45 top-0 right-0.5 ${bg}`}
      />

      {/* Clock Face Ring */}
      <View
        className={`w-[18px] h-[18px] rounded-full border-[1.8px] items-center justify-center relative ${border}`}
      >
        {/* Hour Hand */}
        <View
          className={`absolute w-[1.6px] h-[5px] rounded-full top-[2.5px] left-[6.2px] ${bg}`}
        />
        {/* Minute Hand */}
        <View
          className={`absolute w-[4.5px] h-[1.6px] rounded-full top-[6.2px] left-[6.2px] ${bg}`}
        />
        {/* Center pin */}
        <View
          className={`absolute w-[2.5px] h-[2.5px] rounded-full top-[6px] left-[6px] ${bg}`}
        />
      </View>

      {/* Bottom feet */}
      <View
        className={`absolute w-[2px] h-1 rounded-sm rotate-[25deg] bottom-0 left-1 ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-1 rounded-sm -rotate-[25deg] bottom-0 right-1 ${bg}`}
      />
    </View>
  );
}

function SleepIcon({ focused }: { focused: boolean }) {
  const borderLeft = focused ? 'border-l-slate-900' : 'border-l-slate-400';
  const borderBottom = focused ? 'border-b-slate-900' : 'border-b-slate-400';
  const bg = focused ? 'bg-slate-900' : 'bg-slate-400';

  return (
    <View className="w-[22px] h-[22px] items-center justify-center relative">
      {/* Crescent Moon */}
      <View
        className={`w-[17px] h-[17px] rounded-full border-2 border-transparent -rotate-[35deg] ${borderLeft} ${borderBottom}`}
      />
      {/* Companion star */}
      <View
        className={`absolute top-0.5 right-0.5 w-1 h-1 rounded-full ${bg}`}
      />
    </View>
  );
}

function MorningIcon({ focused }: { focused: boolean }) {
  const bg = focused ? 'bg-slate-900' : 'bg-slate-400';
  const border = focused ? 'border-slate-900' : 'border-slate-400';

  return (
    <View className="w-[22px] h-[22px] items-center justify-center relative">
      {/* Central Sun Circle */}
      <View
        className={`w-2.5 h-2.5 rounded-full border-[1.8px] ${border}`}
      />

      {/* Cardinal Rays */}
      <View
        className={`absolute w-[1.8px] h-[3px] rounded-full top-0 left-[10px] ${bg}`}
      />
      <View
        className={`absolute w-[1.8px] h-[3px] rounded-full bottom-0 left-[10px] ${bg}`}
      />
      <View
        className={`absolute w-[3px] h-[1.8px] rounded-full top-[10px] left-0 ${bg}`}
      />
      <View
        className={`absolute w-[3px] h-[1.8px] rounded-full top-[10px] right-0 ${bg}`}
      />

      {/* Diagonal Rays */}
      <View
        className={`absolute w-[1.8px] h-[2.5px] rounded-full rotate-45 top-[2.5px] left-[2.5px] ${bg}`}
      />
      <View
        className={`absolute w-[1.8px] h-[2.5px] rounded-full -rotate-45 top-[2.5px] right-[2.5px] ${bg}`}
      />
      <View
        className={`absolute w-[1.8px] h-[2.5px] rounded-full -rotate-45 bottom-[2.5px] left-[2.5px] ${bg}`}
      />
      <View
        className={`absolute w-[1.8px] h-[2.5px] rounded-full rotate-45 bottom-[2.5px] right-[2.5px] ${bg}`}
      />
    </View>
  );
}

function ReportIcon({ focused }: { focused: boolean }) {
  const bg = focused ? 'bg-slate-900' : 'bg-slate-400';

  return (
    <View className="w-[22px] h-[22px] items-center justify-center relative">
      {/* Baseline */}
      <View
        className={`absolute bottom-0.5 left-0.5 right-0.5 h-[1.6px] rounded-full ${bg}`}
      />

      {/* 3 Analytics Bars */}
      <View
        className={`absolute bottom-1 left-1 w-1 h-2 rounded-t-sm ${bg}`}
      />
      <View
        className={`absolute bottom-1 left-[9px] w-1 h-[15px] rounded-t-sm ${bg}`}
      />
      <View
        className={`absolute bottom-1 left-4 w-1 h-[11px] rounded-t-sm ${bg}`}
      />
    </View>
  );
}

function SettingsIcon({ focused }: { focused: boolean }) {
  const bg = focused ? 'bg-slate-900' : 'bg-slate-400';
  const border = focused ? 'border-slate-900' : 'border-slate-400';

  return (
    <View className="w-[22px] h-[22px] items-center justify-center relative">
      {/* Main Gear Ring */}
      <View
        className={`w-[13px] h-[13px] rounded-full border-[1.8px] items-center justify-center ${border}`}
      >
        <View className={`w-1 h-1 rounded-full ${bg}`} />
      </View>

      {/* 4 Outer Cogs / Teeth */}
      <View
        className={`absolute w-[3.5px] h-[2px] rounded-sm top-0.5 left-[9.2px] ${bg}`}
      />
      <View
        className={`absolute w-[3.5px] h-[2px] rounded-sm bottom-0.5 left-[9.2px] ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-[3.5px] rounded-sm top-[9.2px] left-0.5 ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-[3.5px] rounded-sm top-[9.2px] right-0.5 ${bg}`}
      />

      {/* Diagonal Cogs */}
      <View
        className={`absolute w-[2px] h-[2px] rounded-sm rotate-45 top-1 left-1 ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-[2px] rounded-sm -rotate-45 top-1 right-1 ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-[2px] rounded-sm -rotate-45 bottom-1 left-1 ${bg}`}
      />
      <View
        className={`absolute w-[2px] h-[2px] rounded-sm rotate-45 bottom-1 right-1 ${bg}`}
      />
    </View>
  );
}

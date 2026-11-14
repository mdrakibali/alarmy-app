import React from 'react';
import { View, StyleSheet } from 'react-native';

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
  size = 24,
  hasBadge = false,
}: TabVectorIconProps) {
  const activeColor = color ?? (focused ? '#0F172A' : '#94A3B8');

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {name === 'alarm' && <AlarmIcon color={activeColor} />}
      {name === 'sleep' && <SleepIcon color={activeColor} />}
      {name === 'morning' && <MorningIcon color={activeColor} />}
      {name === 'report' && <ReportIcon color={activeColor} />}
      {name === 'settings' && <SettingsIcon color={activeColor} />}

      {hasBadge && (
        <View style={styles.badge} />
      )}
    </View>
  );
}

function AlarmIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      {/* Top bells */}
      <View
        style={[
          styles.bell,
          {
            backgroundColor: color,
            top: 0,
            left: 2,
            transform: [{ rotate: '-35deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.bell,
          {
            backgroundColor: color,
            top: 0,
            right: 2,
            transform: [{ rotate: '35deg' }],
          },
        ]}
      />

      {/* Clock Face Ring */}
      <View
        style={[
          styles.clockRing,
          {
            borderColor: color,
          },
        ]}
      >
        {/* Hour Hand */}
        <View
          style={[
            styles.clockHandHour,
            {
              backgroundColor: color,
            },
          ]}
        />
        {/* Minute Hand */}
        <View
          style={[
            styles.clockHandMinute,
            {
              backgroundColor: color,
            },
          ]}
        />
        {/* Center pin */}
        <View
          style={[
            styles.centerPin,
            {
              backgroundColor: color,
            },
          ]}
        />
      </View>

      {/* Bottom feet */}
      <View
        style={[
          styles.clockFoot,
          {
            backgroundColor: color,
            bottom: 0,
            left: 3,
            transform: [{ rotate: '25deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.clockFoot,
          {
            backgroundColor: color,
            bottom: 0,
            right: 3,
            transform: [{ rotate: '-25deg' }],
          },
        ]}
      />
    </View>
  );
}

function SleepIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      {/* Crescent Moon */}
      <View
        style={[
          styles.moonShape,
          {
            borderLeftColor: color,
            borderBottomColor: color,
          },
        ]}
      />
      {/* Tiny companion star */}
      <View
        style={[
          styles.starDot,
          {
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function MorningIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      {/* Central Sun Circle */}
      <View
        style={[
          styles.sunRing,
          {
            borderColor: color,
          },
        ]}
      />

      {/* Cardinal Rays */}
      <View style={[styles.rayVertical, { backgroundColor: color, top: 0, left: 10 }]} />
      <View style={[styles.rayVertical, { backgroundColor: color, bottom: 0, left: 10 }]} />
      <View style={[styles.rayHorizontal, { backgroundColor: color, top: 10, left: 0 }]} />
      <View style={[styles.rayHorizontal, { backgroundColor: color, top: 10, right: 0 }]} />

      {/* Diagonal Rays */}
      <View
        style={[
          styles.rayDiagonal,
          {
            backgroundColor: color,
            top: 2.5,
            left: 2.5,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.rayDiagonal,
          {
            backgroundColor: color,
            top: 2.5,
            right: 2.5,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.rayDiagonal,
          {
            backgroundColor: color,
            bottom: 2.5,
            left: 2.5,
            transform: [{ rotate: '-45deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.rayDiagonal,
          {
            backgroundColor: color,
            bottom: 2.5,
            right: 2.5,
            transform: [{ rotate: '45deg' }],
          },
        ]}
      />
    </View>
  );
}

function ReportIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      {/* Baseline */}
      <View style={[styles.chartBaseline, { backgroundColor: color }]} />

      {/* 3 Analytics Bars */}
      <View
        style={[
          styles.chartBar,
          {
            height: 8,
            backgroundColor: color,
            left: 2.5,
          },
        ]}
      />
      <View
        style={[
          styles.chartBar,
          {
            height: 15,
            backgroundColor: color,
            left: 8.5,
          },
        ]}
      />
      <View
        style={[
          styles.chartBar,
          {
            height: 11,
            backgroundColor: color,
            left: 14.5,
          },
        ]}
      />
    </View>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <View style={styles.iconBox}>
      {/* Main Gear Ring */}
      <View
        style={[
          styles.gearRing,
          {
            borderColor: color,
          },
        ]}
      >
        {/* Inner Hub Dot */}
        <View style={[styles.gearHub, { backgroundColor: color }]} />
      </View>

      {/* 4 Outer Cogs / Teeth */}
      <View style={[styles.cogVertical, { backgroundColor: color, top: 1, left: 9 }]} />
      <View style={[styles.cogVertical, { backgroundColor: color, bottom: 1, left: 9 }]} />
      <View style={[styles.cogHorizontal, { backgroundColor: color, top: 9, left: 1 }]} />
      <View style={[styles.cogHorizontal, { backgroundColor: color, top: 9, right: 1 }]} />

      {/* 4 Diagonal Cogs */}
      <View
        style={[
          styles.cogDiagonal,
          { backgroundColor: color, top: 3, left: 3, transform: [{ rotate: '45deg' }] },
        ]}
      />
      <View
        style={[
          styles.cogDiagonal,
          { backgroundColor: color, top: 3, right: 3, transform: [{ rotate: '-45deg' }] },
        ]}
      />
      <View
        style={[
          styles.cogDiagonal,
          { backgroundColor: color, bottom: 3, left: 3, transform: [{ rotate: '-45deg' }] },
        ]}
      />
      <View
        style={[
          styles.cogDiagonal,
          { backgroundColor: color, bottom: 3, right: 3, transform: [{ rotate: '45deg' }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBox: {
    width: 22,
    height: 22,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 6.5,
    height: 6.5,
    borderRadius: 3.25,
    backgroundColor: '#FF385C',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  // Alarm
  bell: {
    position: 'absolute',
    width: 4.5,
    height: 2.2,
    borderRadius: 1,
  },
  clockRing: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockHandHour: {
    position: 'absolute',
    width: 1.6,
    height: 5,
    borderRadius: 0.8,
    top: 2.5,
    left: 6.1,
  },
  clockHandMinute: {
    position: 'absolute',
    width: 4,
    height: 1.6,
    borderRadius: 0.8,
    top: 6.1,
    left: 6.1,
  },
  centerPin: {
    position: 'absolute',
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    top: 5.6,
    left: 5.6,
  },
  clockFoot: {
    position: 'absolute',
    width: 1.6,
    height: 3.2,
    borderRadius: 0.8,
  },
  // Sleep
  moonShape: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 2,
    borderColor: 'transparent',
    transform: [{ rotate: '-35deg' }],
  },
  starDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
  // Morning
  sunRing: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.8,
  },
  rayVertical: {
    position: 'absolute',
    width: 1.8,
    height: 3,
    borderRadius: 0.9,
  },
  rayHorizontal: {
    position: 'absolute',
    width: 3,
    height: 1.8,
    borderRadius: 0.9,
  },
  rayDiagonal: {
    position: 'absolute',
    width: 1.8,
    height: 2.5,
    borderRadius: 0.9,
  },
  // Report
  chartBaseline: {
    position: 'absolute',
    bottom: 1.5,
    left: 1,
    right: 1,
    height: 1.6,
    borderRadius: 0.8,
  },
  chartBar: {
    position: 'absolute',
    bottom: 3.5,
    width: 4,
    borderTopLeftRadius: 1.5,
    borderTopRightRadius: 1.5,
  },
  // Settings
  gearRing: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    borderWidth: 1.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gearHub: {
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
  },
  cogVertical: {
    position: 'absolute',
    width: 3.5,
    height: 2.2,
    borderRadius: 1,
  },
  cogHorizontal: {
    position: 'absolute',
    width: 2.2,
    height: 3.5,
    borderRadius: 1,
  },
  cogDiagonal: {
    position: 'absolute',
    width: 2.5,
    height: 2.2,
    borderRadius: 0.8,
  },
});

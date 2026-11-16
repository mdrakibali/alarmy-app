import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

export function daypartFor(date: Date): Daypart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

const COPY: Record<Daypart, { title: string; sky: [string, string]; accent: string }> = {
  morning: { title: 'Good Morning', sky: ['#FFE7BA', '#8FB7C9'], accent: '#FF7A00' },
  afternoon: { title: 'Good Afternoon', sky: ['#8EC5E8', '#F4F7F2'], accent: '#FF9500' },
  evening: { title: 'Good Evening', sky: ['#F3B183', '#725088'], accent: '#FF7A00' },
  night: { title: 'Good Night', sky: ['#060E22', '#0A194E'], accent: '#FFB800' },
};

export function DaypartHeader({
  now,
  countdown,
}: {
  now: Date;
  countdown: string | null;
}) {
  const part = daypartFor(now);
  const theme = COPY[part];
  const drift = useRef(new Animated.Value(0)).current;
  const cloudX = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 18],
  });

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [drift]);
  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    [now],
  );
  const clock = now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <View className="mx-4 mt-3 mb-3 overflow-hidden rounded-3xl bg-white">
      <View style={{ height: 168 }}>
        <Svg width="100%" height="100%" viewBox="0 0 360 168" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={theme.sky[0]} />
              <Stop offset="1" stopColor={theme.sky[1]} />
            </LinearGradient>
          </Defs>
          <Path d="M0 0 H360 V168 H0 Z" fill="url(#sky)" />
          {part === 'night' ? <Stars /> : null}
          {part === 'night' ? (
            <Path
              d="M250 36 a16 16 0 1 0 18 22 a12 12 0 1 1 -18 -22"
              fill="#F4E7C3"
            />
          ) : (
            <Circle cx={part === 'evening' ? 250 : 78} cy={part === 'evening' ? 78 : 52} r="18" fill={theme.accent} />
          )}
          {part === 'morning' ? <Birds /> : null}
          <Path d="M0 118 C70 96 120 132 180 118 C240 104 290 138 360 112 V168 H0 Z" fill="#2563EB" />
          <Path d="M0 136 C80 120 150 150 230 134 C290 124 330 146 360 138 V168 H0 Z" fill="#08173E" />
        </Svg>
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: 168,
            transform: [{ translateX: cloudX }],
          }}
        >
          <Svg width="100%" height="100%" viewBox="0 0 360 168" preserveAspectRatio="xMidYMid slice">
            <Cloud cx={120} cy={48} fill={part === 'night' ? '#24362C' : '#FFFFFF'} />
            <Cloud cx={210} cy={70} fill={part === 'night' ? '#1C2C24' : '#F7F4EE'} />
          </Svg>
        </Animated.View>
      </View>
      <View className="px-4 pb-4 -mt-2">
        <Text className="text-2xl font-black text-[#08173E]">{theme.title}</Text>
        <Text className="text-sm text-[#556889] mt-0.5">
          {dateLabel} · {clock}
        </Text>
        <Text className="text-sm font-bold text-[#1652E6] mt-2">
          {countdown ? `Next alarm in ${countdown}` : 'No upcoming alarm'}
        </Text>
      </View>
    </View>
  );
}

function Cloud({ cx, cy, fill }: { cx: number; cy: number; fill: string }) {
  return (
    <G>
      <Ellipse cx={cx} cy={cy} rx="28" ry="12" fill={fill} opacity={0.92} />
      <Ellipse cx={cx - 16} cy={cy + 2} rx="16" ry="10" fill={fill} />
      <Ellipse cx={cx + 16} cy={cy + 3} rx="18" ry="10" fill={fill} />
    </G>
  );
}

function Birds() {
  return (
    <G stroke="#08173E" strokeWidth="1.4" fill="none">
      <Path d="M150 58 q6 -6 12 0 q6 -6 12 0" />
      <Path d="M176 46 q5 -5 10 0 q5 -5 10 0" />
    </G>
  );
}

function Stars() {
  const points = [
    [40, 28],
    [70, 52],
    [110, 24],
    [160, 40],
    [200, 22],
    [300, 48],
    [330, 26],
  ];
  return (
    <G>
      {points.map(([x, y]) => (
        <Circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="#F4E7C3" />
      ))}
    </G>
  );
}

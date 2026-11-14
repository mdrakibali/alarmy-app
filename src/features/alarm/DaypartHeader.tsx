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
  morning: { title: 'Good Morning', sky: ['#F6E2B3', '#8FB7C9'], accent: '#E2A938' },
  afternoon: { title: 'Good Afternoon', sky: ['#8EC5E8', '#F4F7F2'], accent: '#E2A938' },
  evening: { title: 'Good Evening', sky: ['#F3B183', '#8C5A73'], accent: '#E2A938' },
  night: { title: 'Good Night', sky: ['#0D1612', '#1A2E22'], accent: '#E2A938' },
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

  const [cloudShift, setCloudShift] = React.useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    const sub = drift.addListener(({ value }) => setCloudShift(value * 18));
    loop.start();
    return () => {
      loop.stop();
      drift.removeListener(sub);
    };
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
          <G transform={`translate(${cloudShift} 0)`}>
            <Cloud cx={120} cy={48} fill={part === 'night' ? '#24362C' : '#FFFFFF'} />
            <Cloud cx={210} cy={70} fill={part === 'night' ? '#1C2C24' : '#F7F4EE'} />
          </G>
          {part === 'morning' ? <Birds /> : null}
          <Path d="M0 118 C70 96 120 132 180 118 C240 104 290 138 360 112 V168 H0 Z" fill="#6B8F71" />
          <Path d="M0 136 C80 120 150 150 230 134 C290 124 330 146 360 138 V168 H0 Z" fill="#1A2E22" />
        </Svg>
      </View>
      <View className="px-4 pb-4 -mt-2">
        <Text className="text-2xl font-black text-[#1A2E22]">{theme.title}</Text>
        <Text className="text-sm text-[#5E7166] mt-0.5">
          {dateLabel} · {clock}
        </Text>
        <Text className="text-sm font-bold text-[#6B8F71] mt-2">
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
    <G stroke="#1A2E22" strokeWidth="1.4" fill="none">
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

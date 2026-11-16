import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

export type Daypart = 'morning' | 'afternoon' | 'evening' | 'night';

export function daypartFor(date: Date): Daypart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'evening';
  return 'night';
}

interface DaypartTheme {
  title: string;
  image: any;
  cardBg: string;
  dateColor: string;
  titleColor: string;
  badgeBg: string;
  badgeText: string;
}

const THEMES: Record<Daypart, DaypartTheme> = {
  morning: {
    title: 'Good Morning',
    image: require('@/assets/images/good-morning.png'),
    cardBg: 'bg-[#FFF7ED] border-[#FED7AA]',
    dateColor: 'text-[#EA580C]',
    titleColor: 'text-navy',
    badgeBg: 'bg-[#FFEDD5] border-[#FDBA74]/50',
    badgeText: 'text-[#C2410C]',
  },
  afternoon: {
    title: 'Good Afternoon',
    image: require('@/assets/images/good-afternoon.png'),
    cardBg: 'bg-[#F0F7FF] border-[#BAE6FD]',
    dateColor: 'text-[#0284C7]',
    titleColor: 'text-navy',
    badgeBg: 'bg-[#E0F2FE] border-[#7DD3FC]/50',
    badgeText: 'text-[#0369A1]',
  },
  evening: {
    title: 'Good Evening',
    image: require('@/assets/images/good-afternoon.png'),
    cardBg: 'bg-[#FFF1F2] border-[#FECDD3]',
    dateColor: 'text-[#E11D48]',
    titleColor: 'text-navy',
    badgeBg: 'bg-[#FFE4E6] border-[#FDA4AF]/50',
    badgeText: 'text-[#BE123C]',
  },
  night: {
    title: 'Good Night',
    image: require('@/assets/images/good-night.png'),
    cardBg: 'bg-[#0F172A] border-[#1E293B]',
    dateColor: 'text-[#94A3B8]',
    titleColor: 'text-white',
    badgeBg: 'bg-white/10 border-white/15',
    badgeText: 'text-[#FDE047]',
  },
};

export function DaypartHeader({
  now,
  countdown,
}: {
  now: Date;
  countdown: string | null;
}) {
  const part = daypartFor(now);
  const theme = THEMES[part];

  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim]);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -5],
  });

  const dateLabel = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }),
    [now],
  );

  return (
    <View
      className={`mx-4 mt-3 mb-3 p-5 rounded-3xl border shadow-sm flex-row items-center justify-between overflow-hidden relative ${theme.cardBg}`}
    >
      {/* Left side: Date, Greeting, and Status */}
      <View className="flex-1 pr-3 z-10">
        <Text
          className={`text-xs font-bold uppercase tracking-wider ${theme.dateColor}`}
        >
          {dateLabel}
        </Text>

        <Text
          className={`text-2xl font-black tracking-tight mt-0.5 ${theme.titleColor}`}
        >
          {theme.title}
        </Text>

        <View className="mt-3 flex-row items-center">
          <View
            className={`px-3 py-1.5 rounded-full flex-row items-center border ${theme.badgeBg}`}
          >
            <Text className="text-xs mr-1.5">
              {countdown ? '⏰' : '✨'}
            </Text>
            <Text
              className={`text-xs font-bold ${theme.badgeText}`}
              numberOfLines={1}
            >
              {countdown ? `Ring in ${countdown}` : 'No upcoming alarms'}
            </Text>
          </View>
        </View>
      </View>

      {/* Right side: Illustration */}
      <Animated.View
        style={{ transform: [{ translateY }] }}
        className="items-center justify-center z-10"
      >
        <Image
          source={theme.image}
          className="w-28 h-28"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

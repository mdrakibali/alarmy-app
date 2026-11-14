import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 40;
const PADDING_VERTICAL = ITEM_HEIGHT * 3; // 120px (3 items above, 1 center, 3 items below)

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

interface WheelTimePickerProps {
  hour: number; // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}

export function WheelTimePicker({
  hour,
  minute,
  onChange,
}: WheelTimePickerProps) {
  const initialHour12 = hour % 12 === 0 ? 12 : hour % 12;
  const initialIsPM = hour >= 12;

  // Local active state for instant real-time visual highlight during scroll
  const [activeHour12, setActiveHour12] = useState(initialHour12);
  const [activeMin, setActiveMin] = useState(minute);
  const [activeIsPM, setActiveIsPM] = useState(initialIsPM);

  const hourScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const minScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const periodScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Keep refs in sync for handlers without stale closures
  const activeHour12Ref = useRef(activeHour12);
  activeHour12Ref.current = activeHour12;
  const activeMinRef = useRef(activeMin);
  activeMinRef.current = activeMin;
  const activeIsPMRef = useRef(activeIsPM);
  activeIsPMRef.current = activeIsPM;

  const notifyChange = (h12: number, min: number, isPm: boolean) => {
    const new24h = isPm
      ? h12 === 12
        ? 12
        : h12 + 12
      : h12 === 12
      ? 0
      : h12;
    onChange(new24h, min);
  };

  // Initial scroll position on mount only
  useEffect(() => {
    const timer = setTimeout(() => {
      const hourIdx = HOURS_12.indexOf(initialHour12);
      if (hourIdx !== -1) {
        hourScrollRef.current?.scrollTo({
          y: hourIdx * ITEM_HEIGHT,
          animated: false,
        });
      }

      const minIdx = MINUTES.indexOf(minute);
      if (minIdx !== -1) {
        minScrollRef.current?.scrollTo({
          y: minIdx * ITEM_HEIGHT,
          animated: false,
        });
      }

      const periodIdx = initialIsPM ? 1 : 0;
      periodScrollRef.current?.scrollTo({
        y: periodIdx * ITEM_HEIGHT,
        animated: false,
      });
    }, 60);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time scroll handlers (throttle 16ms = 60fps)
  const handleHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(HOURS_12.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const h12 = HOURS_12[index];
    if (h12 !== activeHour12Ref.current) {
      setActiveHour12(h12);
      notifyChange(h12, activeMinRef.current, activeIsPMRef.current);
    }
  };

  const handleMinScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(MINUTES.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const m = MINUTES[index];
    if (m !== activeMinRef.current) {
      setActiveMin(m);
      notifyChange(activeHour12Ref.current, m, activeIsPMRef.current);
    }
  };

  const handlePeriodScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(PERIODS.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const isPm = index === 1;
    if (isPm !== activeIsPMRef.current) {
      setActiveIsPM(isPm);
      notifyChange(activeHour12Ref.current, activeMinRef.current, isPm);
    }
  };

  // Direct tap selectors
  const selectHour = (h: number) => {
    const idx = HOURS_12.indexOf(h);
    if (idx !== -1) {
      setActiveHour12(h);
      hourScrollRef.current?.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: true,
      });
      notifyChange(h, activeMinRef.current, activeIsPMRef.current);
    }
  };

  const selectMinute = (m: number) => {
    const idx = MINUTES.indexOf(m);
    if (idx !== -1) {
      setActiveMin(m);
      minScrollRef.current?.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: true,
      });
      notifyChange(activeHour12Ref.current, m, activeIsPMRef.current);
    }
  };

  const selectPeriod = (p: 'AM' | 'PM') => {
    const isPm = p === 'PM';
    const idx = isPm ? 1 : 0;
    setActiveIsPM(isPm);
    periodScrollRef.current?.scrollTo({
      y: idx * ITEM_HEIGHT,
      animated: true,
    });
    notifyChange(activeHour12Ref.current, activeMinRef.current, isPm);
  };

  return (
    <View className="relative w-full h-[280px] flex-row items-center justify-center overflow-hidden my-1">
      {/* Center highlight rounded pill across all 3 columns (Alarmy Style) */}
      <View
        pointerEvents="none"
        className="absolute top-[120px] left-3 right-3 h-[40px] rounded-2xl bg-slate-100 border border-slate-200/80 shadow-xs"
      />

      {/* Hours Column (Single-digit 1-9 or 10-12 like native Alarmy) */}
      <View className="h-[280px] w-20">
        <ScrollView
          ref={hourScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleHourScroll}
          onScrollEndDrag={handleHourScroll}
          onMomentumScrollEnd={handleHourScroll}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {HOURS_12.map(h => {
            const distance = Math.abs(h - activeHour12);
            const isSelected = distance === 0;

            const textStyle = isSelected
              ? 'text-3xl font-extrabold text-slate-900 scale-105'
              : distance === 1
              ? 'text-2xl font-bold text-slate-400/80'
              : distance === 2
              ? 'text-xl font-semibold text-slate-300/70'
              : 'text-base font-medium text-slate-200/40';

            return (
              <Pressable
                key={h}
                onPress={() => selectHour(h)}
                className="h-[40px] items-center justify-center active:opacity-60"
              >
                <Text className={`text-center ${textStyle}`}>{h}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Subtle Natural Spacing (No colon) */}
      <View className="w-3" />

      {/* Minutes Column (00-59) */}
      <View className="h-[280px] w-20">
        <ScrollView
          ref={minScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleMinScroll}
          onScrollEndDrag={handleMinScroll}
          onMomentumScrollEnd={handleMinScroll}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {MINUTES.map(m => {
            const distance = Math.abs(m - activeMin);
            const isSelected = distance === 0;
            const str = m.toString().padStart(2, '0');

            const textStyle = isSelected
              ? 'text-3xl font-extrabold text-slate-900 scale-105'
              : distance === 1
              ? 'text-2xl font-bold text-slate-400/80'
              : distance === 2
              ? 'text-xl font-semibold text-slate-300/70'
              : 'text-base font-medium text-slate-200/40';

            return (
              <Pressable
                key={m}
                onPress={() => selectMinute(m)}
                className="h-[40px] items-center justify-center active:opacity-60"
              >
                <Text className={`text-center ${textStyle}`}>{str}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Spacing between Minute and AM/PM */}
      <View className="w-4" />

      {/* AM / PM Column */}
      <View className="h-[280px] w-16">
        <ScrollView
          ref={periodScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handlePeriodScroll}
          onScrollEndDrag={handlePeriodScroll}
          onMomentumScrollEnd={handlePeriodScroll}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {PERIODS.map(p => {
            const isSelected = (p === 'PM') === activeIsPM;

            const textStyle = isSelected
              ? 'text-2xl font-extrabold text-slate-900 scale-105'
              : 'text-xl font-bold text-slate-300/70';

            return (
              <Pressable
                key={p}
                onPress={() => selectPeriod(p)}
                className="h-[40px] items-center justify-center active:opacity-60"
              >
                <Text className={`text-center ${textStyle}`}>{p}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

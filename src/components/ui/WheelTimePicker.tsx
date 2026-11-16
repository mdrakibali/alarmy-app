import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 44;
const CONTAINER_HEIGHT = 220; // 5 visible rows (2 above, 1 center, 2 below)
const PADDING_VERTICAL = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 88px

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const PERIODS = ['AM', 'PM'] as const;

interface WheelTimePickerProps {
  hour: number; // 0-23
  minute: number; // 0-59
  onChange: (hour: number, minute: number) => void;
}

export const WheelTimePicker = React.memo(
  function WheelTimePickerComponent({
    hour,
    minute,
    onChange,
  }: WheelTimePickerProps) {
  const initialHour12 = hour % 12 === 0 ? 12 : hour % 12;
  const initialIsPM = hour >= 12;

  const [activeHour12, setActiveHour12] = useState(initialHour12);
  const [activeMin, setActiveMin] = useState(minute);
  const [activeIsPM, setActiveIsPM] = useState(initialIsPM);

  const hourScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const minScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const periodScrollRef = useRef<React.ElementRef<typeof ScrollView>>(null);

  // Keep references without stale closures
  const activeHour12Ref = useRef(activeHour12);
  activeHour12Ref.current = activeHour12;
  const activeMinRef = useRef(activeMin);
  activeMinRef.current = activeMin;
  const activeIsPMRef = useRef(activeIsPM);
  activeIsPMRef.current = activeIsPM;

  const commitChange = (h12: number, min: number, isPm: boolean) => {
    const new24h = isPm
      ? h12 === 12
        ? 12
        : h12 + 12
      : h12 === 12
      ? 0
      : h12;
    onChange(new24h, min);
  };

  // Initial scroll position on mount
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
    }, 50);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Visual highlight during scroll - DOES NOT trigger parent onChange
  const handleHourScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(HOURS_12.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const h12 = HOURS_12[index];
    if (h12 !== activeHour12Ref.current) {
      setActiveHour12(h12);
    }
  };

  // Commit on scroll finish
  const handleHourScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(HOURS_12.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const h12 = HOURS_12[index];
    setActiveHour12(h12);
    commitChange(h12, activeMinRef.current, activeIsPMRef.current);
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
    }
  };

  const handleMinScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(MINUTES.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const m = MINUTES[index];
    setActiveMin(m);
    commitChange(activeHour12Ref.current, m, activeIsPMRef.current);
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
    }
  };

  const handlePeriodScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(PERIODS.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const isPm = index === 1;
    setActiveIsPM(isPm);
    commitChange(activeHour12Ref.current, activeMinRef.current, isPm);
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
      commitChange(h, activeMinRef.current, activeIsPMRef.current);
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
      commitChange(activeHour12Ref.current, m, activeIsPMRef.current);
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
    commitChange(activeHour12Ref.current, activeMinRef.current, isPm);
  };

  return (
    <View className="relative w-full h-[220px] flex-row items-center justify-center overflow-hidden my-1">
      {/* Center highlight rounded pill across all columns (iOS / Alba Style) */}
      <View
        pointerEvents="none"
        className="absolute top-[88px] left-4 right-4 h-[50px] rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-xs"
      />

      {/* Hours Column */}
      <View className="w-20">
        <ScrollView
          ref={hourScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleHourScroll}
          onMomentumScrollEnd={handleHourScrollEnd}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {HOURS_12.map(h => {
            const isSelected = h === activeHour12;
            return (
              <Pressable
                key={h}
                onPress={() => selectHour(h)}
                className="h-[44px] items-center justify-center active:opacity-60"
              >
                <Text
                  className={`text-center ${
                    isSelected
                      ? 'text-3xl font-black text-slate-900'
                      : 'text-2xl font-bold text-slate-400/60'
                  }`}
                >
                  {h < 10 ? `0${h}` : `${h}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Colon Separator */}
      <View className=" w-8 items-center justify-center z-10">
        <Text className="text-2xl font-black text-slate-700">:</Text>
      </View>

      {/* Minutes Column */}
      <View className="w-20">
        <ScrollView
          ref={minScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleMinScroll}
          onMomentumScrollEnd={handleMinScrollEnd}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {MINUTES.map(m => {
            const isSelected = m === activeMin;
            const str = m.toString().padStart(2, '0');
            return (
              <Pressable
                key={m}
                onPress={() => selectMinute(m)}
                className="h-[44px] items-center justify-center active:opacity-60"
              >
                <Text
                  className={`text-center ${
                    isSelected
                      ? 'text-3xl font-black text-slate-900'
                      : 'text-2xl font-bold text-slate-400/60'
                  }`}
                >
                  {str}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* AM / PM Column */}
      <View className="h-[220px] w-20 ml-2">
        <ScrollView
          ref={periodScrollRef}
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handlePeriodScroll}
          onMomentumScrollEnd={handlePeriodScrollEnd}
          contentContainerStyle={{
            paddingTop: PADDING_VERTICAL,
            paddingBottom: PADDING_VERTICAL,
          }}
        >
          {PERIODS.map(p => {
            const isSelected = (p === 'PM') === activeIsPM;
            return (
              <Pressable
                key={p}
                onPress={() => selectPeriod(p)}
                className="h-[44px] items-center justify-center active:opacity-60"
              >
                <Text
                  className={`text-center ${
                    isSelected
                      ? 'text-xl font-black text-slate-900'
                      : 'text-lg font-bold text-slate-400/60'
                  }`}
                >
                  {p}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
},
  (prev, next) => prev.hour === next.hour && prev.minute === next.minute
);

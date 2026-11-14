import React, { useEffect, useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 144px

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
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  const isPM = hour >= 12;

  const hourScrollRef = useRef<any>(null);
  const minScrollRef = useRef<any>(null);
  const periodScrollRef = useRef<any>(null);

  // Initial scroll position
  useEffect(() => {
    const hourIdx = HOURS_12.indexOf(hour12);
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

    const periodIdx = isPM ? 1 : 0;
    periodScrollRef.current?.scrollTo({
      y: periodIdx * ITEM_HEIGHT,
      animated: false,
    });
  }, []);

  const handleHourScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(HOURS_12.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const selectedH12 = HOURS_12[index];
    const new24h = isPM
      ? selectedH12 === 12
        ? 12
        : selectedH12 + 12
      : selectedH12 === 12
      ? 0
      : selectedH12;
    onChange(new24h, minute);
  };

  const handleMinScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(MINUTES.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const selectedMin = MINUTES[index];
    onChange(hour, selectedMin);
  };

  const handlePeriodScrollEnd = (
    e: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const y = e.nativeEvent.contentOffset.y;
    const index = Math.max(
      0,
      Math.min(PERIODS.length - 1, Math.round(y / ITEM_HEIGHT)),
    );
    const targetPM = index === 1;
    if (targetPM !== isPM) {
      const new24h = targetPM
        ? hour12 === 12
          ? 12
          : hour12 + 12
        : hour12 === 12
        ? 0
        : hour12;
      onChange(new24h, minute);
    }
  };

  const selectHour = (h: number) => {
    const idx = HOURS_12.indexOf(h);
    if (idx !== -1) {
      hourScrollRef.current?.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: true,
      });
      const new24h = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
      onChange(new24h, minute);
    }
  };

  const selectMinute = (m: number) => {
    const idx = MINUTES.indexOf(m);
    if (idx !== -1) {
      minScrollRef.current?.scrollTo({
        y: idx * ITEM_HEIGHT,
        animated: true,
      });
      onChange(hour, m);
    }
  };

  const selectPeriod = (p: 'AM' | 'PM') => {
    const idx = p === 'PM' ? 1 : 0;
    periodScrollRef.current?.scrollTo({
      y: idx * ITEM_HEIGHT,
      animated: true,
    });
    const targetPM = p === 'PM';
    const new24h = targetPM
      ? hour12 === 12
        ? 12
        : hour12 + 12
      : hour12 === 12
      ? 0
      : hour12;
    onChange(new24h, minute);
  };

  return (
    <View
      style={{ height: PICKER_HEIGHT }}
      className="relative my-4 w-full flex-row items-center justify-center overflow-hidden"
    >
      {/* Center highlight rounded capsule */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: ITEM_HEIGHT,
          left: 12,
          right: 12,
          height: ITEM_HEIGHT,
        }}
        className="rounded-2xl bg-slate-100 border border-slate-200/60"
      />

      {/* Hours column */}
      <View style={{ height: PICKER_HEIGHT, width: 72 }}>
        <ScrollView
          ref={hourScrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleHourScrollEnd}
          onScrollEndDrag={handleHourScrollEnd}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {HOURS_12.map(h => {
            const isSelected = h === hour12;
            const str = h.toString().padStart(2, '0');
            return (
              <Pressable
                key={h}
                onPress={() => selectHour(h)}
                style={{ height: ITEM_HEIGHT }}
                className="items-center justify-center"
              >
                <Text
                  className={`text-2xl font-bold ${
                    isSelected ? 'text-slate-900' : 'text-slate-400 opacity-60'
                  }`}
                >
                  {str}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Colon separator */}
      <View
        style={{ height: ITEM_HEIGHT, width: 24 }}
        className="items-center justify-center z-10"
      >
        <Text className="text-2xl font-bold text-slate-800">:</Text>
      </View>

      {/* Minutes column */}
      <View style={{ height: PICKER_HEIGHT, width: 72 }}>
        <ScrollView
          ref={minScrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleMinScrollEnd}
          onScrollEndDrag={handleMinScrollEnd}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {MINUTES.map(m => {
            const isSelected = m === minute;
            const str = m.toString().padStart(2, '0');
            return (
              <Pressable
                key={m}
                onPress={() => selectMinute(m)}
                style={{ height: ITEM_HEIGHT }}
                className="items-center justify-center"
              >
                <Text
                  className={`text-2xl font-bold ${
                    isSelected ? 'text-slate-900' : 'text-slate-400 opacity-60'
                  }`}
                >
                  {str}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* AM / PM column */}
      <View style={{ height: PICKER_HEIGHT, width: 70 }} className="ml-2">
        <ScrollView
          ref={periodScrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handlePeriodScrollEnd}
          onScrollEndDrag={handlePeriodScrollEnd}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT,
            paddingBottom: ITEM_HEIGHT,
          }}
        >
          {PERIODS.map(p => {
            const isSelected = (p === 'PM') === isPM;
            return (
              <Pressable
                key={p}
                onPress={() => selectPeriod(p)}
                style={{ height: ITEM_HEIGHT }}
                className="items-center justify-center"
              >
                <Text
                  className={`text-lg font-bold ${
                    isSelected ? 'text-slate-900' : 'text-slate-400 opacity-50'
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
}

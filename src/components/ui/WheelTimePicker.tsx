/* eslint-disable react-native/no-inline-styles */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { NativeAlarm } from '@/native/AlarmModule';

const ITEM_HEIGHT = 44;
const CONTAINER_HEIGHT = 220; // 5 visible rows (2 above, 1 center, 2 below)
const PADDING_VERTICAL = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 88px

const HOURS_12_BASE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES_BASE = Array.from({ length: 60 }, (_, i) => i);

const HOUR_LOOPS = 60; // 720 virtual items
const MINUTE_LOOPS = 40; // 2400 virtual items

interface WheelColumnProps {
  items: number[];
  loopCount: number;
  initialValue: number;
  formatLabel: (val: number) => string;
  onSelected: (val: number) => void;
  width?: number;
}

const WheelColumn = React.memo(function WheelColumnComponent({
  items,
  loopCount,
  initialValue,
  formatLabel,
  onSelected,
  width = 76,
}: WheelColumnProps) {
  const listRef = useRef<FlatList<number>>(null);
  const baseCount = items.length;
  const middleLoop = Math.floor(loopCount / 2);
  const initialIndexInBase = Math.max(0, items.indexOf(initialValue));
  const initialTargetIndex = middleLoop * baseCount + initialIndexInBase;

  const [activeIndex, setActiveIndex] = useState(initialTargetIndex);
  const activeIndexRef = useRef(initialTargetIndex);
  activeIndexRef.current = activeIndex;

  const lastHapticIndexRef = useRef(initialTargetIndex);

  // Flattened virtual data array
  const data = useMemo(() => {
    const arr = new Array(baseCount * loopCount);
    for (let i = 0; i < arr.length; i++) {
      arr[i] = items[i % baseCount];
    }
    return arr;
  }, [items, baseCount, loopCount]);

  // Initial scroll to center loop on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      listRef.current?.scrollToOffset({
        offset: initialTargetIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 40);
    return () => clearTimeout(timer);
  }, [initialTargetIndex]);

  // Sync when initialValue changes from outside
  useEffect(() => {
    const currentVal = items[activeIndexRef.current % baseCount];
    if (currentVal !== initialValue) {
      const targetBaseIdx = items.indexOf(initialValue);
      if (targetBaseIdx !== -1) {
        const currentLoop = Math.floor(activeIndexRef.current / baseCount);
        const newTarget = currentLoop * baseCount + targetBaseIdx;
        setActiveIndex(newTarget);
        listRef.current?.scrollToOffset({
          offset: newTarget * ITEM_HEIGHT,
          animated: true,
        });
      }
    }
  }, [initialValue, items, baseCount]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const nearest = Math.round(y / ITEM_HEIGHT);
      if (nearest !== activeIndexRef.current) {
        setActiveIndex(nearest);
        if (nearest !== lastHapticIndexRef.current) {
          lastHapticIndexRef.current = nearest;
          NativeAlarm.triggerHapticTick();
        }
      }
    },
    [],
  );

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const nearest = Math.max(0, Math.min(data.length - 1, Math.round(y / ITEM_HEIGHT)));
      setActiveIndex(nearest);

      const resolvedVal = items[nearest % baseCount];
      onSelected(resolvedVal);

      // Rebase near middle loop if user scrolled too far into boundaries
      const currentLoop = Math.floor(nearest / baseCount);
      if (Math.abs(currentLoop - middleLoop) > 8) {
        const rebasedIndex = middleLoop * baseCount + (nearest % baseCount);
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: rebasedIndex * ITEM_HEIGHT,
            animated: false,
          });
          setActiveIndex(rebasedIndex);
        }, 30);
      }
    },
    [data.length, baseCount, items, middleLoop, onSelected],
  );

  const handleItemPress = useCallback(
    (index: number) => {
      listRef.current?.scrollToOffset({
        offset: index * ITEM_HEIGHT,
        animated: true,
      });
      setActiveIndex(index);
      const resolvedVal = items[index % baseCount];
      onSelected(resolvedVal);
      NativeAlarm.triggerHapticTick();
    },
    [baseCount, items, onSelected],
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: number; index: number }) => {
      const diff = index - activeIndex;
      if (Math.abs(diff) > 2) {
        return <View style={{ height: ITEM_HEIGHT, width }} />;
      }

      // 3D Cylindrical Perspective Math
      const angle = diff * 26; // degrees
      const scale = 1 - Math.min(Math.abs(diff), 2.5) * 0.12;
      const opacity = Math.max(0.18, 1 - Math.min(Math.abs(diff), 2.5) * 0.38);
      const isCenter = diff === 0;

      return (
        <Pressable
          onPress={() => handleItemPress(index)}
          style={[
            styles.itemContainer,
            {
              width,
              height: ITEM_HEIGHT,
              transform: [
                { perspective: 600 },
                { rotateX: `${-angle}deg` },
                { scale },
                { translateY: Math.sin((angle * Math.PI) / 180) * 7 },
              ],
              opacity,
            },
          ]}
        >
          <Text
            style={[
              styles.itemText,
              isCenter ? styles.centerText : styles.sideText,
            ]}
          >
            {formatLabel(item)}
          </Text>
        </Pressable>
      );
    },
    [activeIndex, formatLabel, handleItemPress, width],
  );

  return (
    <View style={{ width, height: CONTAINER_HEIGHT }}>
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(_, i) => String(i)}
        getItemLayout={getItemLayout}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: PADDING_VERTICAL,
          paddingBottom: PADDING_VERTICAL,
        }}
        initialNumToRender={14}
        maxToRenderPerBatch={18}
        windowSize={7}
        removeClippedSubviews={true}
      />
    </View>
  );
});

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
    const currentHour12 = hour % 12 === 0 ? 12 : hour % 12;
    const currentIsPM = hour >= 12;

    const [activeHour12, setActiveHour12] = useState(currentHour12);
    const [activeMin, setActiveMin] = useState(minute);
    const [isPM, setIsPM] = useState(currentIsPM);

    useEffect(() => {
      setActiveHour12(hour % 12 === 0 ? 12 : hour % 12);
      setIsPM(hour >= 12);
    }, [hour]);

    useEffect(() => {
      setActiveMin(minute);
    }, [minute]);

    const commitTime = useCallback(
      (h12: number, min: number, pm: boolean) => {
        const new24 = pm
          ? h12 === 12
            ? 12
            : h12 + 12
          : h12 === 12
          ? 0
          : h12;
        onChange(new24, min);
      },
      [onChange],
    );

    const handleHourSelected = useCallback(
      (h12: number) => {
        setActiveHour12(h12);
        commitTime(h12, activeMin, isPM);
      },
      [activeMin, commitTime, isPM],
    );

    const handleMinuteSelected = useCallback(
      (min: number) => {
        setActiveMin(min);
        commitTime(activeHour12, min, isPM);
      },
      [activeHour12, commitTime, isPM],
    );

    const handlePeriodToggle = useCallback(
      (nextPM: boolean) => {
        if (isPM !== nextPM) {
          setIsPM(nextPM);
          NativeAlarm.triggerHapticTick();
          commitTime(activeHour12, activeMin, nextPM);
        }
      },
      [activeHour12, activeMin, commitTime, isPM],
    );

    const applyNudge = useCallback(
      (deltaMin: number) => {
        const current24 = isPM
          ? activeHour12 === 12
            ? 12
            : activeHour12 + 12
          : activeHour12 === 12
          ? 0
          : activeHour12;
        const totalMin = current24 * 60 + activeMin + deltaMin;
        const wrappedMin = ((totalMin % 1440) + 1440) % 1440;
        const nextHour24 = Math.floor(wrappedMin / 60);
        const nextMin = wrappedMin % 60;
        NativeAlarm.triggerHapticTick();
        onChange(nextHour24, nextMin);
      },
      [activeHour12, activeMin, isPM, onChange],
    );

    return (
      <View className="w-full items-center py-1">
        {/* Main 3D Cylinder Viewport */}
        <View style={styles.viewportContainer}>
          {/* Frosted Center Selection Pill (Apple / Alba Precision Lens) */}
          <View pointerEvents="none" style={styles.centerLens} />

          {/* Top 3D Cylindrical Curve Gradient Mask */}
          <Svg height={52} width="100%" style={styles.topMask} pointerEvents="none">
            <Defs>
              <LinearGradient id="topFadeMask" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="52" fill="url(#topFadeMask)" />
          </Svg>

          {/* Bottom 3D Cylindrical Curve Gradient Mask */}
          <Svg height={52} width="100%" style={styles.bottomMask} pointerEvents="none">
            <Defs>
              <LinearGradient id="bottomFadeMask" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.96" />
                <Stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="52" fill="url(#bottomFadeMask)" />
          </Svg>

          {/* Columns Row */}
          <View className="flex-row items-center justify-center">
            {/* Hours Infinite 3D Wheel */}
            <WheelColumn
              items={HOURS_12_BASE}
              loopCount={HOUR_LOOPS}
              initialValue={currentHour12}
              formatLabel={val => (val < 10 ? `0${val}` : `${val}`)}
              onSelected={handleHourSelected}
              width={76}
            />

            {/* Colon Separator */}
            <View className="w-6 items-center justify-center z-10">
              <Text style={styles.colonText}>:</Text>
            </View>

            {/* Minutes Infinite 3D Wheel */}
            <WheelColumn
              items={MINUTES_BASE}
              loopCount={MINUTE_LOOPS}
              initialValue={minute}
              formatLabel={val => (val < 10 ? `0${val}` : `${val}`)}
              onSelected={handleMinuteSelected}
              width={76}
            />

            {/* AM / PM Segmented Control */}
            <View className="ml-3.5 z-20">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handlePeriodToggle(false)}
                style={[
                  styles.periodPill,
                  !isPM ? styles.periodPillActive : styles.periodPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    !isPM ? styles.periodTextActive : styles.periodTextInactive,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => handlePeriodToggle(true)}
                style={[
                  styles.periodPill,
                  { marginTop: 8 },
                  isPM ? styles.periodPillActive : styles.periodPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    isPM ? styles.periodTextActive : styles.periodTextInactive,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Adjustment Pills (-15m, -5m, +5m, +15m) */}
        <View className="flex-row items-center justify-center mt-3 gap-2">
          {[-15, -5, 5, 15].map(delta => (
            <TouchableOpacity
              key={delta}
              activeOpacity={0.7}
              onPress={() => applyNudge(delta)}
              className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/60 active:bg-slate-200"
            >
              <Text className="text-[11px] font-extrabold text-slate-600">
                {delta > 0 ? `+${delta}m` : `${delta}m`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  },
  (prev, next) => prev.hour === next.hour && prev.minute === next.minute,
);

const styles = StyleSheet.create({
  viewportContainer: {
    position: 'relative',
    width: '100%',
    height: CONTAINER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  centerLens: {
    position: 'absolute',
    top: 86,
    left: 16,
    right: 16,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(241, 245, 249, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  bottomMask: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  centerText: {
    fontSize: 34,
    fontWeight: '900',
    color: '#08173E', // Alba Deep Navy
  },
  sideText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#64748B', // Slate
  },
  colonText: {
    fontSize: 30,
    fontWeight: '900',
    color: '#08173E',
    marginTop: -2,
  },
  periodPill: {
    width: 58,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillActive: {
    backgroundColor: '#1652E6', // Alba Primary Blue
    shadowColor: '#1652E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  periodPillInactive: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  periodTextActive: {
    color: '#FFFFFF',
  },
  periodTextInactive: {
    color: '#64748B',
  },
});

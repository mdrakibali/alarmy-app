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

const ITEM_HEIGHT = 68; // ktAlarm standard rowHeight = 68dp
const CONTAINER_HEIGHT = 204; // 3 visible rows (68dp * 3 = 204dp)
const PADDING_VERTICAL = (CONTAINER_HEIGHT - ITEM_HEIGHT) / 2; // 68dp

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
  width = 82,
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

      // Exact ktAlarm Cylindrical Trigonometry:
      // angle = diff * (PI / 3) rad = diff * 60 deg
      // scale = cos(angle)
      // translateY = sin(angle) * rowHeight / 0.8660254f
      const isCenter = diff === 0;
      const angleDeg = diff * 42; // subtle perspective angle
      const scale = isCenter ? 1 : Math.max(0.68, 1 - Math.abs(diff) * 0.28);
      const opacity = isCenter ? 1 : Math.max(0.24, 0.45 - Math.abs(diff) * 0.15);
      const translateY = diff * 4;

      return (
        <Pressable
          onPress={() => handleItemPress(index)}
          style={[
            styles.itemContainer,
            {
              width,
              height: ITEM_HEIGHT,
              transform: [
                { perspective: 800 },
                { rotateX: `${-angleDeg}deg` },
                { scale },
                { translateY },
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
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={5}
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
        {/* Main 3D Cylinder Viewport matching ktAlarm (280dp wide, 204dp high) */}
        <View style={styles.viewportContainer}>
          {/* ktAlarm Center Selection Pill: #F5F5F5 / rgba(245, 245, 245, 1) with 18dp rounded corners */}
          <View pointerEvents="none" style={styles.centerLens} />

          {/* Top 3D Soft Fade Mask */}
          <Svg height={48} width="100%" style={styles.topMask} pointerEvents="none">
            <Defs>
              <LinearGradient id="topFadeMask" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <Stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="48" fill="url(#topFadeMask)" />
          </Svg>

          {/* Bottom 3D Soft Fade Mask */}
          <Svg height={48} width="100%" style={styles.bottomMask} pointerEvents="none">
            <Defs>
              <LinearGradient id="bottomFadeMask" x1="0" y1="1" x2="0" y2="0">
                <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
                <Stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="48" fill="url(#bottomFadeMask)" />
          </Svg>

          {/* ktAlarm Layout: Hours (width 82) + Colon (width 30) + Minutes (width 82) + Stacked AM/PM (width 60) */}
          <View style={styles.pickerRow}>
            {/* Hours Infinite 3D Wheel */}
            <WheelColumn
              items={HOURS_12_BASE}
              loopCount={HOUR_LOOPS}
              initialValue={currentHour12}
              formatLabel={val => (val < 10 ? `0${val}` : `${val}`)}
              onSelected={handleHourSelected}
              width={82}
            />

            {/* Colon Separator - ktAlarm 42sp styling */}
            <View style={styles.colonContainer}>
              <Text style={styles.colonText}>:</Text>
            </View>

            {/* Minutes Infinite 3D Wheel */}
            <WheelColumn
              items={MINUTES_BASE}
              loopCount={MINUTE_LOOPS}
              initialValue={minute}
              formatLabel={val => (val < 10 ? `0${val}` : `${val}`)}
              onSelected={handleMinuteSelected}
              width={82}
            />

            {/* ktAlarm Vertical AM / PM Stack (60dp wide, 48dp tall each, 8dp margin) */}
            <View style={styles.periodColumn}>
              <TouchableOpacity
                activeOpacity={0.8}
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
                activeOpacity={0.8}
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

        {/* Quick Adjustment Pills (-15m, -5m, +5m, +15m) in clean light styling */}
        <View className="flex-row items-center justify-center mt-3 gap-2">
          {[-15, -5, 5, 15].map(delta => (
            <TouchableOpacity
              key={delta}
              activeOpacity={0.7}
              onPress={() => applyNudge(delta)}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 active:bg-slate-200"
            >
              <Text className="text-xs font-black text-slate-700">
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
    maxWidth: 320,
    height: CONTAINER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  centerLens: {
    position: 'absolute',
    top: 68, // Centered at (204 - 68) / 2
    left: 12,
    right: 12,
    height: 68,
    borderRadius: 18,
    backgroundColor: '#F5F5F5', // ktAlarm standard light gray lens
    borderWidth: 1.5,
    borderColor: '#E8EDF2',
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
    letterSpacing: -1,
  },
  centerText: {
    fontSize: 52, // ktAlarm standard ~52sp font
    fontWeight: '900',
    color: '#0F172A', // Crisp dark navy / slate text
    includeFontPadding: false,
  },
  sideText: {
    fontSize: 38,
    fontWeight: '700',
    color: '#94A3B8', // Soft slate
    includeFontPadding: false,
  },
  colonContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 12,
  },
  colonText: {
    fontSize: 42, // ktAlarm standard 42f colon
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
    includeFontPadding: false,
  },
  periodColumn: {
    marginLeft: 12,
    zIndex: 20,
    justifyContent: 'center',
  },
  periodPill: {
    width: 60, // ktAlarm 60dp width
    height: 48, // ktAlarm 48dp height
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodPillActive: {
    backgroundColor: '#1652E6', // ktAlarm / Alba primary blue accent
    shadowColor: '#1652E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  periodPillInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  periodText: {
    fontSize: 15,
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

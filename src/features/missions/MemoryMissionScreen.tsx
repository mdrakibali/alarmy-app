import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  Text,
  Vibration,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useActiveMissionStore } from '@/storage/activeMissionStore';
import { useAppInsets } from '@/utils/safeArea';
import { dismissAlarmOnMissionSuccess, proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryMission'>;

interface MemoryCard {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_ICONS = ['🌟', '🍕', '🚀', '🐱', '⚽', '🎸', '🎯', '🥑', '⚡', '💎', '🍉', '🔥'];

function generateCards(pairCount: number = 6): MemoryCard[] {
  const chosenIcons = ALL_ICONS.slice(0, Math.min(pairCount, ALL_ICONS.length));
  const deck: MemoryCard[] = [];
  let id = 1;
  const pairList = [...chosenIcons, ...chosenIcons];
  pairList.sort(() => Math.random() - 0.5);

  pairList.forEach(icon => {
    deck.push({
      id: id++,
      icon,
      isFlipped: false,
      isMatched: false,
    });
  });
  return deck;
}

export function MemoryMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const isPreview = Boolean(route.params?.isPreview);
  const totalPairs = isPreview ? 3 : (route.params?.memoryPairs ?? 6);
  const savedSubProgress = useActiveMissionStore.getState().getSubProgress();

  const [cards, setCards] = useState<MemoryCard[]>(() => {
    const fresh = generateCards(totalPairs);
    if (savedSubProgress > 0 && savedSubProgress < totalPairs) {
      const iconsToMatch = ALL_ICONS.slice(0, savedSubProgress);
      return fresh.map(c => ({
        ...c,
        isMatched: iconsToMatch.includes(c.icon),
        isFlipped: iconsToMatch.includes(c.icon),
      }));
    }
    return fresh;
  });
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Disable back press during alarm mission (if not preview)
  useEffect(() => {
    if (isPreview) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [isPreview]);

  const isCompletedRef = useRef(false);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

    if (isPreview) {
      setShowSuccessModal(true);
      return;
    }

    useActiveMissionStore.getState().updateSubProgress(totalPairs);

    try {
      Vibration.vibrate([0, 100, 50, 100]);
    } catch {}

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const hasNext = proceedToNextMission(
      navigation,
      missionIndex,
      allMissions,
      alarmId,
      { memoryPairs: totalPairs },
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['memory'],
      snoozeCount: 0,
    });

    await dismissAlarmOnMissionSuccess(alarmId);
    setShowSuccessModal(true);
  }, [navigation, route.params, totalPairs, isPreview]);

  const handleCardPress = (index: number) => {
    if (isProcessing) return;
    const clicked = cards[index];
    if (clicked.isFlipped || clicked.isMatched) return;

    // Flip the clicked card
    const nextCards = [...cards];
    nextCards[index] = { ...clicked, isFlipped: true };
    setCards(nextCards);

    const nextSelected = [...selectedCards, index];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setIsProcessing(true);
      const [firstIdx, secondIdx] = nextSelected;
      const firstCard = nextCards[firstIdx];
      const secondCard = nextCards[secondIdx];

      if (firstCard.icon === secondCard.icon) {
        // MATCH!
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx], isMatched: true };
            updated[secondIdx] = { ...updated[secondIdx], isMatched: true };

            const matchedCount = updated.filter(c => c.isMatched).length / 2;
            useActiveMissionStore.getState().updateSubProgress(matchedCount);

            const allMatched = updated.every(c => c.isMatched);
            if (allMatched) {
              completeMission();
            }
            return updated;
          });
          setSelectedCards([]);
          setIsProcessing(false);
        }, 300);
      } else {
        // MISMATCH - flip back after delay
        setTimeout(() => {
          setCards(prev => {
            const updated = [...prev];
            updated[firstIdx] = { ...updated[firstIdx], isFlipped: false };
            updated[secondIdx] = { ...updated[secondIdx], isFlipped: false };
            return updated;
          });
          setSelectedCards([]);
          setIsProcessing(false);
        }, 750);
      }
    }
  };

  const matchedPairs = cards.filter(c => c.isMatched).length / 2;

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="flex-1 justify-between px-6"
      >
        {/* Top Header */}
        <View className="items-center mt-3">
          {isPreview ? (
            <View className="w-full bg-amber-50 border border-amber-300 rounded-2xl px-3.5 py-2 mb-3 flex-row items-center justify-between shadow-xs">
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="text-base mr-2">🧪</Text>
                <View>
                  <Text className="text-xs font-bold text-amber-900">Preview Mode</Text>
                  <Text className="text-[10px] text-amber-700">Quick test mode • 3 pairs to verify</Text>
                </View>
              </View>
              <Pressable
                onPress={() => navigation.goBack()}
                className="bg-amber-200/80 px-2.5 py-1 rounded-xl active:bg-amber-300"
              >
                <Text className="text-xs font-bold text-amber-950">Exit ✕</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="bg-ice border border-primary/25 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-primary font-extrabold text-xs uppercase tracking-wider">
              MEMORY MISSION 🧩
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Match All Card Pairs
          </Text>
          <Text className="text-xs text-slate-500 font-semibold mt-1">
            Pairs Matched: {matchedPairs} / {totalPairs}
          </Text>
        </View>

        {/* Dynamic Card Grid */}
        <View className="flex-row flex-wrap justify-between my-4">
          {cards.map((card, idx) => {
            const showFace = card.isFlipped || card.isMatched;
            const cardWidth = totalPairs >= 8 ? 'w-[22%]' : 'w-[30%]';
            return (
              <Pressable
                key={card.id}
                onPress={() => handleCardPress(idx)}
                className={`${cardWidth} h-20 mb-3 rounded-2xl items-center justify-center border-2 shadow-sm ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-400'
                    : showFace
                    ? 'bg-white border-primary'
                    : 'bg-slate-100 border-slate-200 active:bg-slate-200'
                }`}
              >
                {showFace ? (
                  <Text className={totalPairs >= 8 ? 'text-2xl' : 'text-3xl'}>{card.icon}</Text>
                ) : (
                  <Text className="text-xl text-slate-400 font-bold">❓</Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Helper Info */}
        <View className="items-center mb-4">
          <Text className="text-xs font-bold text-slate-400 text-center">
            Tap cards to flip and find the matching icons to turn off the alarm
          </Text>
        </View>
      </View>

      {/* Success Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title={isPreview ? 'Mission Preview Passed! 🎉' : 'Mission Complete! 🌟'}
        message={
          isPreview
            ? "Great job! You've verified the Memory mission. This is what you'll match in the morning to dismiss your alarm."
            : 'All pairs matched! Your mind is active and alert. Good morning!'
        }
        confirmText={isPreview ? 'Done Testing 👍' : 'Start My Day ☀️'}
        icon="🧩"
        onConfirm={() => {
          setShowSuccessModal(false);
          if (isPreview) {
            navigation.goBack();
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
          }
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          if (isPreview) {
            navigation.goBack();
          } else {
            navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
          }
        }}
      />
    </AppBackground>
  );
}

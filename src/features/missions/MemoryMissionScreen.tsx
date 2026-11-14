import React, { useCallback, useEffect, useState } from 'react';
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
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'MemoryMission'>;

interface MemoryCard {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_ICONS = ['🌟', '🍕', '🚀', '🐱', '⚽', '🎸'];

function generateCards(): MemoryCard[] {
  const deck: MemoryCard[] = [];
  let id = 1;
  // Duplicate icons for 6 pairs = 12 cards
  const pairList = [...CARD_ICONS, ...CARD_ICONS];
  // Shuffle
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
  const [cards, setCards] = useState<MemoryCard[]>(() => generateCards());
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Disable back press during alarm mission
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = useCallback(async () => {
    try {
      Vibration.vibrate([0, 100, 50, 100]);
    } catch {}

    const alarmId = route.params?.alarmId;
    const missionIndex = route.params?.missionIndex ?? 0;
    const allMissions = route.params?.missions ?? [];

    const nextMissionIdx = missionIndex + 1;
    if (nextMissionIdx < allMissions.length) {
      const nextMissionKey = allMissions[nextMissionIdx];
      if (nextMissionKey === 'math') {
        navigation.replace('MathMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'shake') {
        navigation.replace('ShakeMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'qr') {
        navigation.replace('BarcodeMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'typing') {
        navigation.replace('TypingMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'memory') {
        navigation.replace('MemoryMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
      if (nextMissionKey === 'step') {
        navigation.replace('StepMission', {
          alarmId,
          missionIndex: nextMissionIdx,
          missions: allMissions,
        });
        return;
      }
    }

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

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
    <AppBackground target="ringing">
      <View
        style={{
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        }}
        className="flex-1 justify-between px-6"
      >
        {/* Top Header */}
        <View className="items-center mt-3">
          <View className="bg-rose-50 border border-rose-200 px-4 py-1.5 rounded-full mb-2">
            <Text className="text-[#FF385C] font-extrabold text-xs uppercase tracking-wider">
              MEMORY MISSION 🧩
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-900 text-center">
            Match All Card Pairs
          </Text>
          <Text className="text-xs text-slate-500 font-semibold mt-1">
            Pairs Matched: {matchedPairs} / 6
          </Text>
        </View>

        {/* 4 x 3 Card Grid */}
        <View className="flex-row flex-wrap justify-between my-4">
          {cards.map((card, idx) => {
            const showFace = card.isFlipped || card.isMatched;
            return (
              <Pressable
                key={card.id}
                onPress={() => handleCardPress(idx)}
                className={`w-[30%] h-24 mb-3 rounded-2xl items-center justify-center border-2 shadow-sm ${
                  card.isMatched
                    ? 'bg-emerald-50 border-emerald-400'
                    : showFace
                    ? 'bg-white border-[#FF385C]'
                    : 'bg-slate-100 border-slate-200 active:bg-slate-200'
                }`}
              >
                {showFace ? (
                  <Text className="text-3xl">{card.icon}</Text>
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
        title="Mission Complete! 🌟"
        message="All pairs matched! Your mind is active and alert. Good morning!"
        confirmText="Start My Day ☀️"
        icon="🧩"
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {}}
      />
    </AppBackground>
  );
}

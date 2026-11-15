import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useAppInsets } from '@/utils/safeArea';
import { proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'TypingMission'>;

const MOTIVATIONAL_PHRASES = [
  'I wake up today full of energy, purpose, and focus.',
  'Every morning is a new opportunity to achieve greatness.',
  'I conquer sleep inertia and choose action over comfort.',
  'Today will be a productive, peaceful, and successful day.',
];

/**
 * Normalizes text for relaxed, error-tolerant typing matching:
 * - Strips double/single quotes (both straight " and curly “ ” ‘ ’)
 * - Removes common punctuation (. , ! ? ; :)
 * - Collapses repeated whitespace
 * - Converts to lowercase
 */
export function normalizeTyping(str: string): string {
  return str
    .replace(/[“”"']/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function checkTypingMatch(input: string, target: string): boolean {
  const cleanInput = input.trim();
  const cleanTarget = target.trim();
  if (!cleanInput) return false;
  // Exact match
  if (cleanInput === cleanTarget) return true;
  // Case-insensitive match
  if (cleanInput.toLowerCase() === cleanTarget.toLowerCase()) return true;
  // Quote-stripped match (if user typed leading/trailing quotation marks)
  const strippedInput = cleanInput.replace(/^[“"']+|[”"']+$/g, '').trim();
  const strippedTarget = cleanTarget.replace(/^[“"']+|[”"']+$/g, '').trim();
  if (strippedInput.toLowerCase() === strippedTarget.toLowerCase()) return true;
  // Punctuation and whitespace tolerant normalized match
  if (normalizeTyping(cleanInput) === normalizeTyping(cleanTarget)) return true;
  if (normalizeTyping(strippedInput) === normalizeTyping(strippedTarget)) return true;
  return false;
}

export function TypingMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const [targetPhrase] = useState(
    () =>
      MOTIVATIONAL_PHRASES[
        Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)
      ],
  );
  const [typedText, setTypedText] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const isCompletedRef = useRef(false);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const completeMission = useCallback(async () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;

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
    );
    if (hasNext) return;

    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
    useReportStore.getState().logAlarmDismissed({
      label: 'Morning Alarm',
      scheduledTime: timeStr,
      dismissedTime: timeStr,
      onTime: true,
      missionsCompleted: allMissions.length > 0 ? allMissions : ['typing'],
      snoozeCount: 0,
    });

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

  const handleChangeText = (text: string) => {
    setTypedText(text);
    if (checkTypingMatch(text, targetPhrase)) {
      completeMission();
    }
  };

  const isMatched = checkTypingMatch(typedText, targetPhrase);
  const progressPercent = Math.min(
    100,
    Math.round((typedText.trim().length / targetPhrase.trim().length) * 100),
  );

  return (
    <AppBackground target="mission">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 20,
            justifyContent: 'space-between',
            flexGrow: 1,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="items-center">
            <View className="px-3 py-1 rounded-full bg-[#EBF3ED] border border-[#6B8F71]/30 mb-2">
              <Text className="text-[#4E7D5B] font-extrabold text-[11px] uppercase tracking-wider">
                Typing Wake-up Mission ⌨️
              </Text>
            </View>
            <Text className="text-xl font-black text-slate-900 text-center">
              Type the affirmation below
            </Text>
            <Text className="text-xs font-semibold text-slate-500 text-center mt-1">
              Typing triggers brain dexterity and dismisses morning brain fog
            </Text>
          </View>

          {/* Target Phrase Display Card (Clean text without deceptive quotes) */}
          <View className="bg-white/95 rounded-3xl p-5 border border-slate-200 shadow-md my-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Target Affirmation
            </Text>
            <Text className="text-lg font-black text-slate-800 leading-relaxed">
              {targetPhrase}
            </Text>

            {/* Live Progress Bar & Helper Tip */}
            <View className="mt-4 pt-3 border-t border-slate-100">
              <View className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <View
                  style={{ width: `${progressPercent}%` }}
                  className={`h-full ${
                    isMatched ? 'bg-emerald-500' : 'bg-[#4E7D5B]'
                  }`}
                />
              </View>
              <View className="flex-row justify-between items-center mt-2">
                <Text className="text-[11px] font-semibold text-slate-400">
                  💡 Tip: Quotes (") & punctuation are optional
                </Text>
                <Text
                  className={`text-[11px] font-bold ${
                    isMatched ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {isMatched ? '✓ 100% Matched!' : `${progressPercent}%`}
                </Text>
              </View>
            </View>
          </View>

          {/* User Input Area */}
          <View className="w-full bg-white rounded-3xl p-4 border border-slate-200 shadow-sm mb-4">
            <TextInput
              value={typedText}
              onChangeText={handleChangeText}
              placeholder="Type affirmation here..."
              placeholderTextColor="#94A3B8"
              multiline
              autoFocus
              className="text-base text-slate-900 font-semibold min-h-[90px] text-top"
            />
          </View>

          {/* Bottom Action */}
          <View className="w-full">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (isMatched) {
                  completeMission();
                }
              }}
              disabled={!isMatched}
              className={`w-full py-4.5 rounded-2xl items-center shadow-md ${
                isMatched ? 'bg-emerald-600' : 'bg-slate-300'
              }`}
            >
              <Text className="text-white font-black text-base">
                {isMatched
                  ? 'Affirmation Matched! Tap to Dismiss ✨'
                  : 'Type to Match Phrase'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Mind Awakened! 🌟"
        message="Affirmation typed accurately! Sleep inertia defeated, have a great day!"
        icon="✍️"
        confirmText="Start My Day"
        cancelText=""
        onConfirm={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
        }}
      />
    </AppBackground>
  );
}

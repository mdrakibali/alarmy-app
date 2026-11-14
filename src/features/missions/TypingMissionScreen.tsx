import React, { useCallback, useEffect, useState } from 'react';
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
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'TypingMission'>;

const MOTIVATIONAL_PHRASES = [
  'I wake up today full of energy, purpose, and focus.',
  'Every morning is a new opportunity to achieve greatness.',
  'I conquer sleep inertia and choose action over comfort.',
  'Today will be a productive, peaceful, and successful day.',
];

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
    }

    await NativeAlarm.stopAlarm();
    setShowSuccessModal(true);
  }, [navigation, route.params]);

  const handleChangeText = (text: string) => {
    setTypedText(text);
    if (text.trim() === targetPhrase.trim()) {
      completeMission();
    }
  };

  const isMatched = typedText.trim() === targetPhrase.trim();

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
            <View className="px-3 py-1 rounded-full bg-violet-50 border border-violet-200 mb-2">
              <Text className="text-violet-700 font-extrabold text-[11px] uppercase tracking-wider">
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

          {/* Target Phrase Display Card */}
          <View className="bg-white/95 rounded-3xl p-5 border border-slate-200 shadow-md my-4">
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Target Affirmation
            </Text>
            <Text className="text-lg font-black text-slate-800 leading-relaxed">
              "{targetPhrase}"
            </Text>
          </View>

          {/* User Input Area */}
          <View className="w-full bg-white rounded-3xl p-4 border border-slate-200 shadow-sm mb-4">
            <TextInput
              value={typedText}
              onChangeText={handleChangeText}
              placeholder="Type exact phrase here..."
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
              className={`w-full py-4 rounded-2xl items-center shadow-md ${
                isMatched ? 'bg-violet-600' : 'bg-slate-300'
              }`}
            >
              <Text className="text-white font-black text-base">
                {isMatched ? 'Affirmation Complete! ✨' : 'Type to Match Phrase'}
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

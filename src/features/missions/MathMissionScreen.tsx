import React, { useRef, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBackground } from '@/components/ui/AppBackground';
import { CustomConfirmModal } from '@/components/ui/CustomConfirmModal';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useReportStore } from '@/storage/reportStore';
import { useAppInsets } from '@/utils/safeArea';
import { proceedToNextMission } from './missionNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MathMission'>;

interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  answer: number;
  options: number[];
}

function generateProblem(): MathProblem {
  const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a = 0;
  let b = 0;
  let ans = 0;

  if (op === '+') {
    a = Math.floor(Math.random() * 40) + 12;
    b = Math.floor(Math.random() * 40) + 12;
    ans = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 50) + 30;
    b = Math.floor(Math.random() * 25) + 5;
    ans = a - b;
  } else {
    a = Math.floor(Math.random() * 11) + 3;
    b = Math.floor(Math.random() * 9) + 2;
    ans = a * b;
  }

  // Generate 3 plausible distractors
  const distractors = new Set<number>();
  const deltas = [-10, -2, -1, 1, 2, 5, 10];
  while (distractors.size < 3) {
    const delta = deltas[Math.floor(Math.random() * deltas.length)];
    const fake = ans + delta;
    if (fake > 0 && fake !== ans) {
      distractors.add(fake);
    }
  }

  // Combine and shuffle options
  const options = Array.from(distractors);
  options.push(ans);
  options.sort(() => Math.random() - 0.5);

  return { num1: a, num2: b, operator: op, answer: ans, options };
}

export function MathMissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const alarmId = route.params?.alarmId;
  const missionIndex = route.params?.missionIndex ?? 0;
  const allMissions = route.params?.missions ?? [];

  const TOTAL_PROBLEMS = 3;
  const [problemIndex, setProblemIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(),
  );
  const [inputMode, setInputMode] = useState<'mcq' | 'keypad'>('mcq');
  const [userInput, setUserInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  React.useEffect(() => {
    // Disable back button during mission
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, []);

  const handleKeyPress = (val: string) => {
    setErrorMsg('');
    if (userInput.length < 6) {
      setUserInput(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setErrorMsg('');
    setUserInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setErrorMsg('');
    setUserInput('');
  };

  const isCompletedRef = useRef(false);

  const verifyAnswer = async (answerValue: number) => {
    if (answerValue === currentProblem.answer) {
      const nextIndex = problemIndex + 1;
      if (nextIndex >= TOTAL_PROBLEMS) {
        if (isCompletedRef.current) return;
        isCompletedRef.current = true;

        const hasNext = proceedToNextMission(
          navigation,
          missionIndex,
          allMissions,
          alarmId,
        );
        if (hasNext) return;

        // All missions complete! Dismiss the alarm!
        const now = new Date();
        const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
        useReportStore.getState().logAlarmDismissed({
          label: 'Morning Alarm',
          scheduledTime: timeStr,
          dismissedTime: timeStr,
          onTime: true,
          missionsCompleted: allMissions.length > 0 ? allMissions : ['math'],
          snoozeCount: 0,
        });
        await NativeAlarm.stopAlarm();
        setShowSuccessModal(true);
      } else {
        setProblemIndex(nextIndex);
        setCurrentProblem(generateProblem());
        setUserInput('');
        setSelectedOption(null);
        setErrorMsg('');
      }
    } else {
      setErrorMsg('Wrong! New math problem generated ❌');
      setCurrentProblem(generateProblem());
      setUserInput('');
      setSelectedOption(null);
    }
  };

  const handleOptionPress = (val: number) => {
    setSelectedOption(val);
    setErrorMsg('');
    setTimeout(() => {
      verifyAnswer(val);
    }, 200);
  };

  const handleSubmitKeypad = () => {
    const entered = parseInt(userInput, 10);
    if (isNaN(entered)) {
      setErrorMsg('Please enter an answer');
      return;
    }
    verifyAnswer(entered);
  };

  const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

  return (
    <AppBackground target="mission">
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 8,
        }}
        className="flex-1 px-5 justify-between"
      >
        {/* Top Header & Progress */}
        <View className="items-center">
          <View className="flex-row items-center justify-between w-full mb-2">
            <View className="px-3 py-1 rounded-full bg-ice border border-primary/25">
              <Text className="text-primary font-extrabold text-[11px] uppercase tracking-wider">
                Math Wake-up Mission
              </Text>
            </View>

            {/* Mode Toggle Pills */}
            <View className="flex-row bg-slate-200/80 p-0.5 rounded-xl">
              <Pressable
                onPress={() => setInputMode('mcq')}
                className={`px-3 py-1 rounded-lg ${
                  inputMode === 'mcq' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    inputMode === 'mcq' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  4 Choice
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setInputMode('keypad')}
                className={`px-3 py-1 rounded-lg ${
                  inputMode === 'keypad' ? 'bg-white shadow-xs' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    inputMode === 'keypad' ? 'text-slate-900' : 'text-slate-500'
                  }`}
                >
                  Keypad
                </Text>
              </Pressable>
            </View>
          </View>

          <Text className="text-slate-500 text-xs font-bold mt-1">
            Problem {problemIndex + 1} of {TOTAL_PROBLEMS}
          </Text>

          {/* Progress Bar */}
          <View className="w-full bg-slate-200/80 h-2 rounded-full mt-2 overflow-hidden">
            <View
              className="bg-primary h-full rounded-full"
              style={{
                width: `${((problemIndex + 1) / TOTAL_PROBLEMS) * 100}%`,
              }}
            />
          </View>
        </View>

        {/* Math Problem Display Card */}
        <View className="items-center bg-white/95 backdrop-blur-md rounded-3xl p-6 border border-slate-100 shadow-md w-full my-3">
          <Text className="text-5xl font-black text-slate-900 tracking-wider">
            {currentProblem.num1} {currentProblem.operator} {currentProblem.num2}
          </Text>

          {inputMode === 'keypad' ? (
            <View className="h-14 w-48 border-b-2 border-primary items-center justify-center mt-4">
              <Text className="text-4xl font-extrabold text-primary">
                {userInput || '?'}
              </Text>
            </View>
          ) : (
            <View className="h-10 items-center justify-center mt-2">
              <Text className="text-xs font-bold text-slate-400">
                Choose the correct answer below
              </Text>
            </View>
          )}

          {errorMsg ? (
            <Text className="text-rose-500 font-bold text-sm mt-2">
              {errorMsg}
            </Text>
          ) : (
            <Text className="text-slate-400 text-[11px] font-semibold mt-2">
              Solve correctly to dismiss the alarm
            </Text>
          )}
        </View>

        {/* Input Controls: MCQ Options or Keypad */}
        {inputMode === 'mcq' ? (
          /* 4-Choice Multiple Choice Grid */
          <View className="w-full mb-3">
            <View className="flex-row flex-wrap justify-between">
              {currentProblem.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                return (
                  <Pressable
                    key={`${opt}-${idx}`}
                    onPress={() => handleOptionPress(opt)}
                    className={`w-[48%] py-5 rounded-2xl mb-3 flex-row items-center px-4 border ${
                      isSelected
                        ? 'bg-ice border-primary'
                        : 'bg-white/95 border-slate-100 shadow-sm active:bg-slate-50'
                    }`}
                  >
                    <View
                      className={`h-8 w-8 rounded-full items-center justify-center mr-3 ${
                        isSelected ? 'bg-primary' : 'bg-slate-100'
                      }`}
                    >
                      <Text
                        className={`text-xs font-black ${
                          isSelected ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        {OPTION_LETTERS[idx]}
                      </Text>
                    </View>
                    <Text
                      className={`text-2xl font-black ${
                        isSelected ? 'text-primary' : 'text-slate-800'
                      }`}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          /* Numeric Keypad */
          <View className="w-full mb-2">
            <View className="flex-row justify-between mb-2">
              {[1, 2, 3].map(n => (
                <KeypadButton
                  key={n}
                  label={String(n)}
                  onPress={() => handleKeyPress(String(n))}
                />
              ))}
            </View>
            <View className="flex-row justify-between mb-2">
              {[4, 5, 6].map(n => (
                <KeypadButton
                  key={n}
                  label={String(n)}
                  onPress={() => handleKeyPress(String(n))}
                />
              ))}
            </View>
            <View className="flex-row justify-between mb-2">
              {[7, 8, 9].map(n => (
                <KeypadButton
                  key={n}
                  label={String(n)}
                  onPress={() => handleKeyPress(String(n))}
                />
              ))}
            </View>
            <View className="flex-row justify-between mb-3">
              <KeypadButton label="C" variant="danger" onPress={handleClear} />
              <KeypadButton label="0" onPress={() => handleKeyPress('0')} />
              <KeypadButton
                label="⌫"
                variant="secondary"
                onPress={handleBackspace}
              />
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmitKeypad}
              className="w-full bg-primary py-4 rounded-2xl items-center active:bg-primary-dark shadow-sm"
            >
              <Text className="text-white text-base font-extrabold tracking-wide">
                Submit Answer
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Completion Modal */}
      <CustomConfirmModal
        visible={showSuccessModal}
        title="Good Morning! ☀️"
        message="Math mission completed successfully. Your alarm is dismissed. Have a fantastic day!"
        icon="🧠"
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

function KeypadButton({
  label,
  onPress,
  variant = 'normal',
}: {
  label: string;
  onPress: () => void;
  variant?: 'normal' | 'secondary' | 'danger';
}) {
  const bg =
    variant === 'danger'
      ? 'bg-rose-50 border border-rose-200 active:bg-rose-100'
      : variant === 'secondary'
      ? 'bg-slate-100 border border-slate-200 active:bg-slate-200'
      : 'bg-white border border-slate-100 shadow-sm active:bg-slate-50';

  const textCol =
    variant === 'danger'
      ? 'text-rose-500'
      : variant === 'secondary'
      ? 'text-slate-600'
      : 'text-slate-900';

  return (
    <Pressable
      onPress={onPress}
      className={`h-14 w-[30%] items-center justify-center rounded-2xl ${bg}`}
    >
      <Text className={`text-2xl font-black ${textCol}`}>{label}</Text>
    </Pressable>
  );
}

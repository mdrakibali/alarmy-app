import React, { useState } from 'react';
import { Alert, BackHandler, Pressable, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MathMission'>;

interface MathProblem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×';
  answer: number;
}

function generateProblem(): MathProblem {
  const ops: Array<'+' | '-' | '×'> = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  if (op === '+') {
    const a = Math.floor(Math.random() * 50) + 10;
    const b = Math.floor(Math.random() * 50) + 10;
    return { num1: a, num2: b, operator: '+', answer: a + b };
  } else if (op === '-') {
    const a = Math.floor(Math.random() * 60) + 30;
    const b = Math.floor(Math.random() * 30) + 5;
    return { num1: a, num2: b, operator: '-', answer: a - b };
  } else {
    const a = Math.floor(Math.random() * 12) + 2;
    const b = Math.floor(Math.random() * 10) + 2;
    return { num1: a, num2: b, operator: '×', answer: a * b };
  }
}

export function MathMissionScreen({ navigation }: Props) {
  const TOTAL_PROBLEMS = 3;
  const [problemIndex, setProblemIndex] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem>(() =>
    generateProblem(),
  );
  const [userInput, setUserInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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

  const handleSubmit = async () => {
    const entered = parseInt(userInput, 10);
    if (isNaN(entered)) {
      setErrorMsg('Please enter an answer');
      return;
    }

    if (entered === currentProblem.answer) {
      const nextIndex = problemIndex + 1;
      if (nextIndex >= TOTAL_PROBLEMS) {
        // Mission complete! Dismiss the alarm!
        await NativeAlarm.stopAlarm();
        Alert.alert('Good Morning! ☀️', 'Math mission completed successfully.', [
          {
            text: 'Great!',
            onPress: () =>
              navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }),
          },
        ]);
      } else {
        setProblemIndex(nextIndex);
        setCurrentProblem(generateProblem());
        setUserInput('');
        setErrorMsg('');
      }
    } else {
      setErrorMsg('Wrong! Try again ❌');
      setUserInput('');
    }
  };

  return (
    <View className="flex-1 bg-slate-950 px-6 py-10 justify-between">
      {/* Top Section: Progress & Header */}
      <View className="items-center mt-4">
        <Text className="text-amber-400 font-bold tracking-wider uppercase text-xs">
          Math Wake-up Mission
        </Text>
        <Text className="text-slate-400 text-sm mt-1">
          Problem {problemIndex + 1} of {TOTAL_PROBLEMS}
        </Text>

        {/* Progress Bar */}
        <View className="w-full bg-slate-800 h-2 rounded-full mt-4 overflow-hidden">
          <View
            className="bg-amber-500 h-full rounded-full"
            style={{ width: `${((problemIndex + 1) / TOTAL_PROBLEMS) * 100}%` }}
          />
        </View>
      </View>

      {/* Middle Section: Math Formula & Answer Input */}
      <View className="items-center my-6">
        <Text className="text-5xl font-bold text-white tracking-wide">
          {currentProblem.num1} {currentProblem.operator} {currentProblem.num2}
        </Text>

        <View className="h-16 w-56 border-b-2 border-amber-500 items-center justify-center mt-6">
          <Text className="text-4xl font-bold text-amber-400">
            {userInput || '?'}
          </Text>
        </View>

        {errorMsg ? (
          <Text className="text-red-400 font-medium text-sm mt-3">
            {errorMsg}
          </Text>
        ) : (
          <Text className="text-slate-500 text-xs mt-3">
            Solve correctly to advance
          </Text>
        )}
      </View>

      {/* Bottom Section: Custom Numeric Keypad */}
      <View className="w-full mb-4">
        <View className="flex-row justify-between mb-3">
          {[1, 2, 3].map(n => (
            <KeypadButton
              key={n}
              label={String(n)}
              onPress={() => handleKeyPress(String(n))}
            />
          ))}
        </View>
        <View className="flex-row justify-between mb-3">
          {[4, 5, 6].map(n => (
            <KeypadButton
              key={n}
              label={String(n)}
              onPress={() => handleKeyPress(String(n))}
            />
          ))}
        </View>
        <View className="flex-row justify-between mb-3">
          {[7, 8, 9].map(n => (
            <KeypadButton
              key={n}
              label={String(n)}
              onPress={() => handleKeyPress(String(n))}
            />
          ))}
        </View>
        <View className="flex-row justify-between mb-4">
          <KeypadButton label="C" variant="danger" onPress={handleClear} />
          <KeypadButton label="0" onPress={() => handleKeyPress('0')} />
          <KeypadButton label="⌫" variant="secondary" onPress={handleBackspace} />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          className="w-full bg-amber-500 py-4 rounded-2xl items-center active:opacity-90"
        >
          <Text className="text-slate-950 text-lg font-bold">Submit Answer</Text>
        </Pressable>
      </View>
    </View>
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
      ? 'bg-red-500/20 active:bg-red-500/30'
      : variant === 'secondary'
      ? 'bg-slate-800 active:bg-slate-700'
      : 'bg-slate-900 active:bg-slate-800';

  const textCol =
    variant === 'danger'
      ? 'text-red-400'
      : variant === 'secondary'
      ? 'text-slate-300'
      : 'text-white';

  return (
    <Pressable
      onPress={onPress}
      className={`h-16 w-24 items-center justify-center rounded-2xl ${bg}`}
    >
      <Text className={`text-2xl font-bold ${textCol}`}>{label}</Text>
    </Pressable>
  );
}

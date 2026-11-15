import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from '@/features/alarm/alarmStore';

export function proceedToNextMission(
  navigation: NativeStackNavigationProp<RootStackParamList, any>,
  currentMissionIndex: number,
  allMissions: string[],
  alarmId?: string,
  extraParams?: {
    squatTarget?: number;
    stepTarget?: number;
    referencePath?: string;
    matchThreshold?: number;
    registeredCode?: string;
  },
): boolean {
  const nextMissionIdx = currentMissionIndex + 1;
  if (nextMissionIdx >= allMissions.length) {
    return false; // No more missions left
  }

  const nextMissionKey = allMissions[nextMissionIdx];
  const alarm = alarmId
    ? useAlarmStore.getState().alarms.find(a => a.id === alarmId)
    : undefined;

  const squatTarget = extraParams?.squatTarget ?? alarm?.squatTarget ?? 10;
  const stepTarget = extraParams?.stepTarget ?? alarm?.stepTarget ?? 20;
  const referencePath =
    extraParams?.referencePath ?? alarm?.photoReferencePath;
  const matchThreshold =
    extraParams?.matchThreshold ?? alarm?.photoMatchThreshold ?? 72;
  const registeredCode = extraParams?.registeredCode ?? alarm?.barcodeValue;

  const baseParams = {
    alarmId,
    missionIndex: nextMissionIdx,
    missions: allMissions,
  };

  switch (nextMissionKey) {
    case 'math':
      navigation.replace('MathMission', baseParams);
      return true;
    case 'shake':
      navigation.replace('ShakeMission', baseParams);
      return true;
    case 'qr':
      navigation.replace('BarcodeMission', { ...baseParams, registeredCode });
      return true;
    case 'typing':
      navigation.replace('TypingMission', baseParams);
      return true;
    case 'memory':
      navigation.replace('MemoryMission', baseParams);
      return true;
    case 'step':
      navigation.replace('StepMission', { ...baseParams, stepTarget });
      return true;
    case 'photo':
      navigation.replace('PhotoMission', {
        ...baseParams,
        referencePath,
        matchThreshold,
      });
      return true;
    case 'squat':
      navigation.replace('SquatMission', { ...baseParams, squatTarget });
      return true;
    default:
      return false;
  }
}

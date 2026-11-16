import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { useActiveMissionStore } from '@/storage/activeMissionStore';

export interface MissionNavigationExtraParams {
  squatTarget?: number;
  stepTarget?: number;
  shakeTarget?: number;
  referencePath?: string;
  matchThreshold?: number;
  registeredCode?: string;
}

export function navigateToMission(
  navigation: NativeStackNavigationProp<RootStackParamList, any> | any,
  missionKey: string,
  params: {
    alarmId?: string;
    missionIndex: number;
    missions: string[];
    squatTarget?: number;
    stepTarget?: number;
    shakeTarget?: number;
    referencePath?: string;
    matchThreshold?: number;
    registeredCode?: string;
  },
  action: 'replace' | 'navigate' = 'replace',
): boolean {
  const alarm = params.alarmId
    ? useAlarmStore.getState().alarms.find(a => a.id === params.alarmId)
    : undefined;

  const squatTarget = params.squatTarget ?? alarm?.squatTarget ?? 3;
  const stepTarget = params.stepTarget ?? alarm?.stepTarget ?? 5;
  const shakeTarget = params.shakeTarget ?? alarm?.shakeTarget ?? 5;
  const referencePath =
    params.referencePath ?? alarm?.photoReferencePath;
  const matchThreshold =
    params.matchThreshold ?? alarm?.photoMatchThreshold ?? 72;
  const registeredCode = params.registeredCode ?? alarm?.barcodeValue;

  const baseParams = {
    alarmId: params.alarmId,
    missionIndex: params.missionIndex,
    missions: params.missions,
  };

  const navFn = action === 'navigate' ? navigation.navigate : navigation.replace;

  switch (missionKey) {
    case 'math':
      navFn('MathMission', baseParams);
      return true;
    case 'shake':
      navFn('ShakeMission', { ...baseParams, shakeTarget });
      return true;
    case 'qr':
      navFn('BarcodeMission', { ...baseParams, registeredCode });
      return true;
    case 'typing':
      navFn('TypingMission', baseParams);
      return true;
    case 'memory':
      navFn('MemoryMission', baseParams);
      return true;
    case 'step':
      navFn('StepMission', { ...baseParams, stepTarget });
      return true;
    case 'photo':
      navFn('PhotoMission', {
        ...baseParams,
        referencePath,
        matchThreshold,
      });
      return true;
    case 'squat':
      navFn('SquatMission', { ...baseParams, squatTarget });
      return true;
    default:
      return false;
  }
}

export function proceedToNextMission(
  navigation: NativeStackNavigationProp<RootStackParamList, any>,
  currentMissionIndex: number,
  allMissions: string[],
  alarmId?: string,
  extraParams?: MissionNavigationExtraParams,
): boolean {
  const currentMissionKey = allMissions[currentMissionIndex] || '';

  // Record completed mission in persistent active store
  let nextMissionIdx = currentMissionIndex + 1;
  if (alarmId) {
    nextMissionIdx = useActiveMissionStore
      .getState()
      .recordMissionCompleted(alarmId, currentMissionIndex, currentMissionKey);
  }

  if (nextMissionIdx >= allMissions.length) {
    // All chained missions successfully completed!
    useActiveMissionStore.getState().clearSession();
    return false; // No more missions left
  }

  const nextMissionKey = allMissions[nextMissionIdx];
  return navigateToMission(
    navigation,
    nextMissionKey,
    {
      alarmId,
      missionIndex: nextMissionIdx,
      missions: allMissions,
      ...extraParams,
    },
    'replace',
  );
}

import type { MissionType } from '@/features/alarm/types';

export type TabParamList = {
  Alarm: undefined;
  Sleep: undefined;
  Morning: undefined;
  Report: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Tabs: undefined;
  WelcomeWizard: undefined;
  Permission: {
    hour: number;
    minute: number;
    wallpaper: string;
    soundId: string;
    mission: MissionType;
    missions?: MissionType[];
  };
  AlarmPreview: {
    hour: number;
    minute: number;
    wallpaper: string;
    soundId: string;
    mission: MissionType;
    missions?: MissionType[];
  };
  AlarmEdit: { id?: string } | undefined;
  AlarmRinging: { id?: string } | undefined;
  SnoozeCountdown: { alarmId: string; intervalMin: number; wallpaper?: string };
  MathMission: { alarmId?: string; missionIndex?: number; missions?: string[]; mathCount?: number; mathDifficulty?: 'easy' | 'normal' | 'hard' } | undefined;
  ShakeMission: { alarmId?: string; missionIndex?: number; missions?: string[]; shakeTarget?: number } | undefined;
  StepMission: { alarmId?: string; missionIndex?: number; missions?: string[]; stepTarget?: number } | undefined;
  PhotoMission: {
    alarmId?: string;
    missionIndex?: number;
    missions?: string[];
    referencePath?: string;
    matchThreshold?: number;
  } | undefined;
  SquatMission: { alarmId?: string; missionIndex?: number; missions?: string[]; squatTarget?: number } | undefined;
  WallpaperGallery: { pickForAlarm?: boolean } | undefined;
  WallpaperPreview: { wallpaperId: string; pickForAlarm?: boolean };
  OfflineLibrary: undefined;
  Report: undefined;
  BarcodeMission: { alarmId?: string; missionIndex?: number; missions?: string[]; registeredCode?: string } | undefined;
  TypingMission: { alarmId?: string; missionIndex?: number; missions?: string[]; typingPhrase?: string } | undefined;
  MemoryMission: { alarmId?: string; missionIndex?: number; missions?: string[]; memoryPairs?: number } | undefined;
};

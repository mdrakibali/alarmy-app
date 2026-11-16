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
    photoReferencePath?: string;
    barcodeValue?: string;
  };
  AlarmPreview: {
    hour: number;
    minute: number;
    wallpaper: string;
    soundId: string;
    mission: MissionType;
    missions?: MissionType[];
    photoReferencePath?: string;
    barcodeValue?: string;
  };
  AlarmEdit: { id?: string } | undefined;
  AlarmRinging: { id?: string } | undefined;
  SnoozeCountdown: { alarmId: string; intervalMin: number; wallpaper?: string };
  MathMission: { alarmId?: string; missionIndex?: number; missions?: string[]; mathCount?: number; mathDifficulty?: 'easy' | 'normal' | 'hard'; isPreview?: boolean } | undefined;
  ShakeMission: { alarmId?: string; missionIndex?: number; missions?: string[]; shakeTarget?: number; isPreview?: boolean } | undefined;
  StepMission: { alarmId?: string; missionIndex?: number; missions?: string[]; stepTarget?: number; isPreview?: boolean } | undefined;
  PhotoMission: {
    alarmId?: string;
    missionIndex?: number;
    missions?: string[];
    referencePath?: string;
    matchThreshold?: number;
    isPreview?: boolean;
  } | undefined;
  SquatMission: { alarmId?: string; missionIndex?: number; missions?: string[]; squatTarget?: number; isPreview?: boolean } | undefined;
  WallpaperGallery: { pickForAlarm?: boolean } | undefined;
  WallpaperPreview: { wallpaperId: string; pickForAlarm?: boolean };
  OfflineLibrary: undefined;
  Report: undefined;
  BarcodeMission: { alarmId?: string; missionIndex?: number; missions?: string[]; registeredCode?: string; isPreview?: boolean } | undefined;
  TypingMission: { alarmId?: string; missionIndex?: number; missions?: string[]; typingPhrase?: string; isPreview?: boolean } | undefined;
  FlipMission: { alarmId?: string; missionIndex?: number; missions?: string[]; flipTarget?: number; isPreview?: boolean } | undefined;
  BlinkMission: { alarmId?: string; missionIndex?: number; missions?: string[]; blinkTarget?: number; isPreview?: boolean } | undefined;
  MemoryMission: { alarmId?: string; missionIndex?: number; missions?: string[]; memoryPairs?: number; isPreview?: boolean } | undefined;
};

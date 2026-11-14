import type { MissionType } from '@/features/alarm/types';

export type TabParamList = {
  Alarm: undefined;
  Sleep: undefined;
  Morning: undefined;
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
  };
  AlarmPreview: {
    hour: number;
    minute: number;
    wallpaper: string;
    soundId: string;
    mission: MissionType;
  };
  AlarmEdit: { id?: string } | undefined;
  AlarmRinging: { id?: string } | undefined;
  SnoozeCountdown: { alarmId: string; intervalMin: number; wallpaper?: string };
  MathMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  ShakeMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  BarcodeMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  TypingMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  MemoryMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  StepMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  PhotoMission: {
    alarmId?: string;
    missionIndex?: number;
    missions?: string[];
    referencePath?: string;
    matchThreshold?: number;
  } | undefined;
  SquatMission: { alarmId?: string; missionIndex?: number; missions?: string[] } | undefined;
  WallpaperGallery: { pickForAlarm?: boolean } | undefined;
  WallpaperPreview: { wallpaperId: string; pickForAlarm?: boolean };
  Report: undefined;
};

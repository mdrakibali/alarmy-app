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
  WallpaperGallery: { onSelect?: (wallpaperId: string) => void } | undefined;
};

export type MissionType =
  | 'math'
  | 'memory'
  | 'typing'
  | 'shake'
  | 'squat'
  | 'qr'
  | 'photo'
  | 'step';

export interface Alarm {
  id: string;
  /** 0-23 */
  hour: number;
  /** 0-59 */
  minute: number;
  label: string;
  /** 0 = Sunday ... 6 = Saturday. Empty = one-time alarm */
  repeatDays: number[];
  enabled: boolean;
  soundId: string;
  volume: number; // 0..1
  vibrate: boolean;
  snooze: { enabled: boolean; intervalMin: number; maxCount: number };
  missions: MissionType[];
  wallpaper?: string;
  snoozedUntil?: number;
  gentleWakeup?: boolean;
}

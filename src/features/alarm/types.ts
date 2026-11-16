export type MissionType =
  | 'math'
  | 'memory'
  | 'typing'
  | 'shake'
  | 'squat'
  | 'qr'
  | 'photo'
  | 'step'
  | 'flip'
  | 'blink';

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
  photoReferencePath?: string;
  photoMatchThreshold?: number;
  barcodeValue?: string;
  stepTarget?: number;
  squatTarget?: number;
  shakeTarget?: number;
  flipTarget?: number;
  blinkTarget?: number;
  mathCount?: number;
  mathDifficulty?: 'easy' | 'normal' | 'hard';
  memoryPairs?: number;
  typingPhrase?: string;
  useVideoAudio?: boolean;
  backupSoundId?: string;
  wakeUpCheckMin?: number;
  timePressure?: boolean;
  labelReminder?: boolean;
  isQuickAlarm?: boolean;
  quickMinutes?: number;
  isHabitAlarm?: boolean;
  habitIcon?: string;
  habitGoal?: string;
}

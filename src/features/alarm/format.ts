import type { Alarm, MissionType } from './types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MISSION_LABEL: Record<MissionType, string> = {
  math: 'Math',
  memory: 'Memory',
  typing: 'Typing',
  shake: 'Shake',
  squat: 'Squat',
  qr: 'QR',
  photo: 'Photo',
  step: 'Steps',
};

export const SOUND_OPTIONS = [
  { id: 'default', label: 'Default' },
  { id: 'rooster', label: 'Rooster' },
  { id: 'beep', label: 'Beep' },
  { id: 'gentle', label: 'Gentle' },
] as const;

export const SNOOZE_INTERVALS = [3, 5, 10, 15, 30];
export const SNOOZE_COUNTS = [1, 2, 3, 5];

export function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  return { time: `${h}:${m}`, period };
}

export function formatRepeat(days: number[]) {
  if (days.length === 0) {
    return 'Once';
  }
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) {
    return 'Every day';
  }
  if (sorted.join() === '1,2,3,4,5') {
    return 'Weekdays';
  }
  if (sorted.join() === '0,6') {
    return 'Weekends';
  }
  return sorted.map(d => DAY_SHORT[d]).join(', ');
}

export function sortAlarms(alarms: Alarm[]) {
  return [...alarms].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );
}

export function blankAlarm(): Omit<Alarm, 'id'> {
  return {
    hour: 7,
    minute: 0,
    label: 'Alarm',
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    soundId: 'default',
    volume: 1,
    vibrate: true,
    snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
    missions: [],
  };
}

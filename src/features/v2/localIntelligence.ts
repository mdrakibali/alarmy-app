export type Difficulty = 'easy' | 'medium' | 'hard';

const ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export function nextDifficulty(current: Difficulty, solvedFast: boolean): Difficulty {
  const index = ORDER.indexOf(current);
  if (solvedFast) return ORDER[Math.min(ORDER.length - 1, index + 1)];
  return ORDER[Math.max(0, index - 1)];
}

export function suggestChronotypeHour(answers: { evening: boolean; lateSleep: boolean }): number {
  if (answers.evening && answers.lateSleep) return 8;
  if (answers.evening) return 7;
  if (answers.lateSleep) return 7;
  return 6;
}

export function dailyMissionSeed(alarmId: string, dayKey: string): number {
  const text = `${alarmId}:${dayKey}`;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 33 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickFromPool<T>(pool: T[], seed: number): T {
  if (pool.length === 0) {
    throw new Error('empty pool');
  }
  return pool[seed % pool.length];
}

export interface BackupAlarm {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

export function buildBackupPayload(alarms: BackupAlarm[]) {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    alarms,
  };
}

export function weatherGreeting(condition: string | null): string {
  if (!condition) return 'Good morning.';
  if (condition === 'rain') return 'Rain this morning. A slow start still counts.';
  if (condition === 'clear') return 'Clear morning. Step into the light.';
  return 'Good morning.';
}

export function canSnooze(enabled: boolean, used: number, max: number): boolean {
  return enabled && used < max;
}

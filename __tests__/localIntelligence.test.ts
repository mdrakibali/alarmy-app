import {
  buildBackupPayload,
  canSnooze,
  dailyMissionSeed,
  nextDifficulty,
  pickFromPool,
  suggestChronotypeHour,
  weatherGreeting,
} from '../src/features/v2/localIntelligence';

describe('local intelligence', () => {
  it('raises and lowers difficulty inside the range', () => {
    expect(nextDifficulty('easy', true)).toBe('medium');
    expect(nextDifficulty('hard', true)).toBe('hard');
    expect(nextDifficulty('medium', false)).toBe('easy');
  });

  it('suggests a later hour for evening types', () => {
    expect(suggestChronotypeHour({ evening: true, lateSleep: true })).toBe(8);
    expect(suggestChronotypeHour({ evening: false, lateSleep: false })).toBe(6);
  });

  it('keeps the same mission pick for one day', () => {
    const seed = dailyMissionSeed('alarm-1', '2026-11-14');
    expect(pickFromPool(['math', 'shake', 'photo'], seed)).toBe(
      pickFromPool(['math', 'shake', 'photo'], dailyMissionSeed('alarm-1', '2026-11-14')),
    );
  });

  it('builds a restorable alarm payload', () => {
    const payload = buildBackupPayload([{ id: 'a', hour: 7, minute: 0, enabled: true }]);
    expect(payload.version).toBe(1);
    expect(payload.alarms).toHaveLength(1);
  });

  it('does not invent weather', () => {
    expect(weatherGreeting(null)).toBe('Good morning.');
    expect(weatherGreeting('rain')).toContain('Rain');
  });

  it('stops snooze at the cap', () => {
    expect(canSnooze(true, 3, 3)).toBe(false);
    expect(canSnooze(true, 2, 3)).toBe(true);
    expect(canSnooze(false, 0, 3)).toBe(false);
  });
});

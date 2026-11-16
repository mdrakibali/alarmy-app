import { useAlarmStore } from '@/features/alarm/alarmStore';

jest.mock('@/native/AlarmModule', () => ({
  NativeAlarm: {
    scheduleAlarm: jest.fn().mockResolvedValue(true),
    cancelAlarm: jest.fn().mockResolvedValue(true),
    listAlarms: jest.fn().mockResolvedValue([]),
    getActiveSnoozedAlarm: jest.fn().mockResolvedValue(null),
  },
}));

describe('Quick Alarm & Habit Alarm Tests', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [] });
  });

  test('can create a Quick Alarm with custom duration', () => {
    const store = useAlarmStore.getState();
    const id = store.addAlarm({
      hour: 14,
      minute: 30,
      label: 'Quick alarm (15m)',
      repeatDays: [],
      enabled: true,
      soundId: 'loud_siren',
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [],
      isQuickAlarm: true,
      quickMinutes: 15,
    });

    const alarms = useAlarmStore.getState().alarms;
    expect(alarms).toHaveLength(1);
    expect(alarms[0].id).toBe(id);
    expect(alarms[0].isQuickAlarm).toBe(true);
    expect(alarms[0].quickMinutes).toBe(15);
    expect(alarms[0].label).toContain('15m');
  });

  test('can create a Habit Alarm with habit icon and goal', () => {
    const store = useAlarmStore.getState();
    const id = store.addAlarm({
      hour: 6,
      minute: 30,
      label: 'Wake up early',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      soundId: 'loud_siren',
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: ['math'],
      isHabitAlarm: true,
      habitIcon: '🐥',
      habitGoal: 'Wake up early',
    });

    const alarms = useAlarmStore.getState().alarms;
    expect(alarms).toHaveLength(1);
    expect(alarms[0].id).toBe(id);
    expect(alarms[0].isHabitAlarm).toBe(true);
    expect(alarms[0].habitIcon).toBe('🐥');
    expect(alarms[0].repeatDays).toHaveLength(7);
    expect(alarms[0].missions).toContain('math');
  });

  test('supports multiple concurrent alarms in the list', () => {
    const store = useAlarmStore.getState();

    // Add regular alarm
    store.addAlarm({
      hour: 7,
      minute: 0,
      label: 'Regular Alarm',
      repeatDays: [1, 2, 3, 4, 5],
      enabled: true,
      soundId: 'default',
      volume: 0.8,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [],
    });

    // Add quick alarm
    store.addAlarm({
      hour: 12,
      minute: 0,
      label: 'Quick Power Nap',
      repeatDays: [],
      enabled: true,
      soundId: 'default',
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [],
      isQuickAlarm: true,
      quickMinutes: 30,
    });

    // Add habit alarm
    store.addAlarm({
      hour: 22,
      minute: 30,
      label: 'Bedtime stretch',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      soundId: 'default',
      volume: 0.9,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: ['squat'],
      isHabitAlarm: true,
      habitIcon: '🏋️‍♂️',
      habitGoal: 'Bedtime stretch',
    });

    const alarms = useAlarmStore.getState().alarms;
    expect(alarms).toHaveLength(3);
    expect(alarms.some(a => a.isQuickAlarm)).toBe(true);
    expect(alarms.some(a => a.isHabitAlarm)).toBe(true);
    expect(alarms.some(a => !a.isQuickAlarm && !a.isHabitAlarm)).toBe(true);

    // Toggle one alarm
    store.toggleAlarm(alarms[0].id);
    expect(useAlarmStore.getState().alarms[0].enabled).toBe(false);

    // Remove one alarm
    store.removeAlarm(alarms[1].id);
    expect(useAlarmStore.getState().alarms).toHaveLength(2);
  });
});


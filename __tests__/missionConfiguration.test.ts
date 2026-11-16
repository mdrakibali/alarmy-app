import { useAlarmStore } from '../src/features/alarm/alarmStore';
import { NativeAlarm } from '../src/native/AlarmModule';
import type { Alarm } from '../src/features/alarm/types';

jest.mock('../src/native/AlarmModule', () => ({
  NativeAlarm: {
    scheduleAlarm: jest.fn().mockResolvedValue(true),
    cancelAlarm: jest.fn().mockResolvedValue(true),
    dismissSnooze: jest.fn().mockResolvedValue(true),
    listAlarms: jest.fn().mockResolvedValue([]),
    stopAlarm: jest.fn().mockResolvedValue(true),
  },
}));

describe('Alarm Mission Configuration & Native Persistence', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [] });
    jest.clearAllMocks();
  });

  it('correctly persists all mission configuration fields when adding an alarm', () => {
    const fullAlarm: Omit<Alarm, 'id'> = {
      hour: 6,
      minute: 45,
      label: 'Morning Routine',
      repeatDays: [1, 2, 3, 4, 5],
      enabled: true,
      soundId: 'alarm_rooster',
      volume: 0.8,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 2 },
      missions: ['photo', 'qr', 'math', 'memory', 'typing', 'squat', 'step', 'shake'],
      photoReferencePath: '/data/user/0/com.alba/files/reference_sink.jpg',
      photoMatchThreshold: 75,
      barcodeValue: '8801234567890',
      mathCount: 5,
      mathDifficulty: 'hard',
      memoryPairs: 8,
      typingPhrase: 'Every day in every way I am getting better.',
      squatTarget: 5,
      stepTarget: 20,
      shakeTarget: 30,
      wallpaper: 'alba_sunrise',
    };

    useAlarmStore.getState().addAlarm(fullAlarm);

    const alarms = useAlarmStore.getState().alarms;
    expect(alarms.length).toBe(1);
    const created = alarms[0];
    expect(created.id).toBeDefined();
    expect(created.photoReferencePath).toBe('/data/user/0/com.alba/files/reference_sink.jpg');
    expect(created.photoMatchThreshold).toBe(75);
    expect(created.barcodeValue).toBe('8801234567890');
    expect(created.mathCount).toBe(5);
    expect(created.mathDifficulty).toBe('hard');
    expect(created.memoryPairs).toBe(8);
    expect(created.typingPhrase).toBe('Every day in every way I am getting better.');
    expect(created.squatTarget).toBe(5);
    expect(created.stepTarget).toBe(20);
    expect(created.shakeTarget).toBe(30);

    // Verify NativeAlarm was invoked with all fields
    expect(NativeAlarm.scheduleAlarm).toHaveBeenCalledTimes(1);
    const scheduled = (NativeAlarm.scheduleAlarm as jest.Mock).mock.calls[0][0];
    expect(scheduled.photoReferencePath).toBe('/data/user/0/com.alba/files/reference_sink.jpg');
    expect(scheduled.barcodeValue).toBe('8801234567890');
    expect(scheduled.mathCount).toBe(5);
    expect(scheduled.squatTarget).toBe(5);
    expect(scheduled.stepTarget).toBe(20);
  });

  it('updates mission configuration and triggers re-schedule on NativeAlarm', () => {
    const initialAlarm: Alarm = {
      id: 'alarm-update-test',
      hour: 7,
      minute: 0,
      label: 'Wake Up',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      soundId: 'default',
      volume: 1,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: ['shake'],
      shakeTarget: 10,
    };

    useAlarmStore.setState({ alarms: [initialAlarm] });

    useAlarmStore.getState().updateAlarm('alarm-update-test', {
      shakeTarget: 25,
      missions: ['shake', 'math'],
      mathCount: 3,
      mathDifficulty: 'normal',
    });

    const updated = useAlarmStore.getState().alarms.find(a => a.id === 'alarm-update-test');
    expect(updated?.shakeTarget).toBe(25);
    expect(updated?.missions).toEqual(['shake', 'math']);
    expect(updated?.mathCount).toBe(3);
    expect(updated?.mathDifficulty).toBe('normal');

    expect(NativeAlarm.scheduleAlarm).toHaveBeenCalledTimes(1);
    const scheduled = (NativeAlarm.scheduleAlarm as jest.Mock).mock.calls[0][0];
    expect(scheduled.shakeTarget).toBe(25);
  });
});


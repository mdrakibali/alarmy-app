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

describe('Phase 1: Snooze Dismissal & Storage Hydration', () => {
  beforeEach(() => {
    useAlarmStore.setState({ alarms: [] });
    jest.clearAllMocks();
  });

  it('safely dismisses snooze on a repeating alarm without disabling or deleting it', () => {
    const repeatingAlarm: Alarm = {
      id: 'alarm-repeat-1',
      hour: 7,
      minute: 0,
      label: 'Work Days',
      repeatDays: [1, 2, 3, 4, 5],
      enabled: true,
      soundId: 'default',
      volume: 1,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: ['math'],
      snoozedUntil: Date.now() + 300000,
    };

    useAlarmStore.setState({ alarms: [repeatingAlarm] });

    useAlarmStore.getState().dismissSnooze('alarm-repeat-1');

    const updated = useAlarmStore.getState().alarms.find(a => a.id === 'alarm-repeat-1');
    expect(updated).toBeDefined();
    expect(updated?.enabled).toBe(true); // Must remain enabled!
    expect(updated?.snoozedUntil).toBeUndefined(); // Snooze cleared
  });

  it('dismisses snooze on a one-time alarm by marking enabled=false without deleting', () => {
    const oneTimeAlarm: Alarm = {
      id: 'alarm-once-1',
      hour: 8,
      minute: 30,
      label: 'Doctor Appointment',
      repeatDays: [], // One-time
      enabled: true,
      soundId: 'default',
      volume: 1,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
      missions: [],
      snoozedUntil: Date.now() + 300000,
    };

    useAlarmStore.setState({ alarms: [oneTimeAlarm] });

    useAlarmStore.getState().dismissSnooze('alarm-once-1');

    const updated = useAlarmStore.getState().alarms.find(a => a.id === 'alarm-once-1');
    expect(updated).toBeDefined();
    expect(updated?.enabled).toBe(false); // One-time alarm is now disabled
    expect(updated?.snoozedUntil).toBeUndefined();
  });

  it('hydrates empty store from native SQLite records with all mission targets', async () => {
    const mockNativeRecords = [
      {
        id: 'native-1',
        hour: 6,
        minute: 45,
        label: 'Gym Morning',
        enabled: true,
        repeatDays: [1, 3, 5],
        soundId: 'gentle_bells',
        volume: 0.9,
        vibrate: true,
        snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
        missions: ['step', 'squat'],
        snoozeUsed: 0,
        snoozeMaxCount: 3,
        triggerTimeMs: 1731740000000,
        stepTarget: 25,
        squatTarget: 10,
        shakeTarget: 15,
        photoReferencePath: '/data/user/0/com.alarmyclone/missions/ref.jpg',
        photoMatchThreshold: 75,
        barcodeValue: '890103038294',
        wallpaper: 'morning_sun',
        mathCount: 3,
        mathDifficulty: 'hard' as const,
        memoryPairs: 6,
      },
    ];

    (NativeAlarm.listAlarms as jest.Mock).mockResolvedValueOnce(mockNativeRecords);

    expect(useAlarmStore.getState().alarms.length).toBe(0);

    await useAlarmStore.getState().syncFromNative();

    const alarms = useAlarmStore.getState().alarms;
    expect(alarms.length).toBe(1);
    expect(alarms[0].id).toBe('native-1');
    expect(alarms[0].stepTarget).toBe(25);
    expect(alarms[0].squatTarget).toBe(10);
    expect(alarms[0].photoReferencePath).toBe('/data/user/0/com.alarmyclone/missions/ref.jpg');
    expect(alarms[0].barcodeValue).toBe('890103038294');
    expect(alarms[0].mathCount).toBe(3);
    expect(alarms[0].mathDifficulty).toBe('hard');
  });
});

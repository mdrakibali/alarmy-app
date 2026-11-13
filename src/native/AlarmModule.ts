import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import type { Alarm } from '@/features/alarm/types';

const { AlarmModule } = NativeModules;

export interface RingingAlarmInfo {
  id: string;
  label: string;
  snoozeEnabled: boolean;
  snoozeIntervalMin: number;
  missions: string[];
}

class AlarmModuleBridge {
  private emitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && AlarmModule) {
      this.emitter = new NativeEventEmitter(AlarmModule);
    }
  }

  async scheduleAlarm(alarm: Alarm): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.scheduleAlarm(alarm);
    } catch (e) {
      console.warn('NativeAlarm scheduleAlarm failed:', e);
      return false;
    }
  }

  async cancelAlarm(alarmId: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.cancelAlarm(alarmId);
    } catch (e) {
      console.warn('NativeAlarm cancelAlarm failed:', e);
      return false;
    }
  }

  async stopAlarm(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.stopAlarm();
    } catch (e) {
      console.warn('NativeAlarm stopAlarm failed:', e);
      return false;
    }
  }

  async snoozeAlarm(alarmId: string, intervalMin: number): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.snoozeAlarm(alarmId, intervalMin);
    } catch (e) {
      console.warn('NativeAlarm snoozeAlarm failed:', e);
      return false;
    }
  }

  async getCurrentlyRingingAlarm(): Promise<RingingAlarmInfo | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return null;
    }
    try {
      return await AlarmModule.getCurrentlyRingingAlarm();
    } catch {
      return null;
    }
  }

  async canScheduleExactAlarms(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return true;
    }
    try {
      return await AlarmModule.canScheduleExactAlarms();
    } catch {
      return true;
    }
  }

  openExactAlarmSettings(): void {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.openExactAlarmSettings();
    }
  }

  async isIgnoringBatteryOptimizations(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return true;
    }
    try {
      return await AlarmModule.isIgnoringBatteryOptimizations();
    } catch {
      return true;
    }
  }

  requestIgnoreBatteryOptimizations(): void {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.requestIgnoreBatteryOptimizations();
    }
  }

  onAlarmDismissed(listener: () => void): EmitterSubscription | null {
    if (!this.emitter) {
      return null;
    }
    return this.emitter.addListener('onAlarmDismissed', listener);
  }
}

export const NativeAlarm = new AlarmModuleBridge();


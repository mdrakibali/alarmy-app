import {
  EmitterSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';
import type { Alarm } from '@/features/alarm/types';

const { AlarmModule } = NativeModules;

export interface NativeAlarmRecord {
  id: string;
  enabled: boolean;
  snoozeUsed: number;
  snoozeMaxCount: number;
  triggerTimeMs: number;
}

export interface RingingAlarmInfo {
  id: string;
  label: string;
  snoozeEnabled: boolean;
  snoozeIntervalMin: number;
  missions: string[];
}

export interface SleepMusicStatus {
  isPlaying: boolean;
  currentSoundId: string | null;
  volume: number;
  remainingSeconds: number;
  durationMs: number;
  positionMs: number;
}

class AlarmModuleBridge {
  private emitter: NativeEventEmitter | null = null;

  constructor() {
    if (Platform.OS === 'android' && AlarmModule) {
      if (typeof AlarmModule.addListener !== 'function') {
        AlarmModule.addListener = () => {};
      }
      if (typeof AlarmModule.removeListeners !== 'function') {
        AlarmModule.removeListeners = () => {};
      }
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

  async startAlarm(alarmId: string): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.startAlarm(alarmId);
    } catch (e) {
      console.warn('NativeAlarm startAlarm failed:', e);
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

  async listAlarms(): Promise<NativeAlarmRecord[]> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return [];
    }
    try {
      const rows = await AlarmModule.listAlarms();
      return Array.isArray(rows) ? rows : [];
    } catch {
      return [];
    }
  }

  async canUseFullScreenIntent(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule?.canUseFullScreenIntent) {
      return true;
    }
    try {
      return await AlarmModule.canUseFullScreenIntent();
    } catch {
      return true;
    }
  }

  openFullScreenIntentSettings(): void {
    if (Platform.OS === 'android' && AlarmModule?.openFullScreenIntentSettings) {
      AlarmModule.openFullScreenIntentSettings();
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

  async previewSound(soundId: string = 'default'): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.previewSound(soundId);
    } catch {
      return false;
    }
  }

  async stopSoundPreview(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.stopSoundPreview();
    } catch {
      return false;
    }
  }

  // ==================== SLEEP MUSIC METHODS ====================

  async playSleepMusic(
    soundId: string,
    volume: number = 0.8,
    loop: boolean = true,
    timerMinutes: number = 0,
  ): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.playSleepMusic(
        soundId,
        volume,
        loop,
        timerMinutes,
      );
    } catch (e) {
      console.warn('NativeAlarm playSleepMusic failed:', e);
      return false;
    }
  }

  async pauseSleepMusic(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.pauseSleepMusic();
    } catch {
      return false;
    }
  }

  async resumeSleepMusic(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.resumeSleepMusic();
    } catch {
      return false;
    }
  }

  async stopSleepMusic(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.stopSleepMusic();
    } catch {
      return false;
    }
  }

  async setSleepMusicVolume(volume: number): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.setSleepMusicVolume(volume);
    } catch {
      return false;
    }
  }

  async seekSleepMusic(positionMs: number): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.seekSleepMusic(positionMs);
    } catch {
      return false;
    }
  }

  async getSleepMusicStatus(): Promise<SleepMusicStatus | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return null;
    }
    try {
      return await AlarmModule.getSleepMusicStatus();
    } catch {
      return null;
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

  async canDrawOverlays(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return true;
    }
    try {
      return await AlarmModule.canDrawOverlays();
    } catch {
      return true;
    }
  }

  openOverlaySettings(): void {
    if (Platform.OS === 'android' && AlarmModule) {
      AlarmModule.openOverlaySettings();
    }
  }

  async startShakeDetection(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.startShakeDetection();
    } catch {
      return false;
    }
  }

  async stopShakeDetection(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return false;
    }
    try {
      return await AlarmModule.stopShakeDetection();
    } catch {
      return false;
    }
  }

  onShake(listener: () => void): () => void {
    if (!this.emitter) {
      return () => {};
    }
    this.startShakeDetection();
    const sub = this.emitter.addListener('onShakeEvent', listener);
    return () => {
      try {
        sub.remove();
      } catch {}
      this.stopShakeDetection();
    };
  }

  async pickLocalImage(): Promise<string | null> {
    if (Platform.OS !== 'android' || !AlarmModule) return null;
    try {
      return await AlarmModule.pickLocalImage();
    } catch {
      return null;
    }
  }

  async exportAlarmBackup(json: string): Promise<string | null> {
    if (Platform.OS !== 'android' || !AlarmModule) return null;
    try {
      return await AlarmModule.exportAlarmBackup(json);
    } catch {
      return null;
    }
  }

  async openCameraMission(options: {
    mode: 'photo' | 'barcode' | 'squat';
    target?: number;
  }): Promise<{ path?: string; value?: string; count?: number; completed?: boolean } | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return null;
    }
    try {
      return await AlarmModule.openCameraMission(options);
    } catch (e) {
      console.warn('openCameraMission', e);
      return null;
    }
  }

  async comparePhotos(
    referencePath: string,
    capturedPath: string,
    threshold: number,
  ): Promise<{ score: number; pass: boolean } | null> {
    if (Platform.OS !== 'android' || !AlarmModule) {
      return null;
    }
    try {
      return await AlarmModule.comparePhotos(referencePath, capturedPath, threshold);
    } catch {
      return null;
    }
  }

  async startStepCounter(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AlarmModule) return false;
    try {
      return await AlarmModule.startStepCounter();
    } catch {
      return false;
    }
  }

  async stopStepCounter(): Promise<void> {
    if (Platform.OS !== 'android' || !AlarmModule) return;
    try {
      await AlarmModule.stopStepCounter();
    } catch {}
  }

  onStepCount(listener: (steps: number) => void): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onStepCount', (...args: readonly unknown[]) => {
      listener(Number(args[0]));
    });
    return () => sub.remove();
  }

  onStepUnavailable(listener: () => void): () => void {
    if (!this.emitter) return () => {};
    const sub = this.emitter.addListener('onStepUnavailable', () => listener());
    return () => sub.remove();
  }

  onAlarmRinging(listener: (alarmId: string | null) => void): EmitterSubscription | null {
    if (!this.emitter) {
      return null;
    }
    return this.emitter.addListener('onAlarmRinging', (data: any) =>
      listener(data as string | null),
    );
  }

  onAlarmDismissed(listener: () => void): EmitterSubscription | null {
    if (!this.emitter) {
      return null;
    }
    return this.emitter.addListener('onAlarmDismissed', listener);
  }
}

export const NativeAlarm = new AlarmModuleBridge();


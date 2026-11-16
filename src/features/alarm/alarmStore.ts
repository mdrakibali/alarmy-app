import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { NativeAlarm } from '@/native/AlarmModule';
import { zustandStorage } from '@/storage/mmkv';
import type { Alarm } from './types';

interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, 'id'>) => string;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
  snoozeAlarm: (id: string, intervalMin: number) => void;
  clearSnooze: (id: string) => void;
  dismissSnooze: (id: string) => void;
  rescheduleAll: () => void;
  syncFromNative: () => Promise<void>;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAlarmStore = create<AlarmState>()(
  persist(
    (set, get) => ({
      alarms: [],
      addAlarm: alarm => {
        const id = newId();
        const newAlarm: Alarm = { ...alarm, id };
        set(s => ({ alarms: [...s.alarms, newAlarm] }));
        if (newAlarm.enabled) {
          NativeAlarm.scheduleAlarm(newAlarm).then(ok => {
            if (!ok) {
              set(s => ({
                alarms: s.alarms.map(item =>
                  item.id === id ? { ...item, enabled: false } : item,
                ),
              }));
            }
          });
        }
        return id;
      },
      updateAlarm: (id, patch) => {
        const current = get().alarms.find(a => a.id === id);
        const updated = current ? { ...current, ...patch } : undefined;
        set(s => ({
          alarms: s.alarms.map(a => (a.id === id ? { ...a, ...patch } : a)),
        }));
        if (!updated) return;
        if (updated.enabled) {
          NativeAlarm.scheduleAlarm(updated).then(ok => {
            if (!ok) {
              set(s => ({
                alarms: s.alarms.map(item =>
                  item.id === id ? { ...item, enabled: false } : item,
                ),
              }));
            }
          });
        } else {
          NativeAlarm.cancelAlarm(id);
        }
      },
      removeAlarm: id => {
        NativeAlarm.cancelAlarm(id);
        set(s => ({ alarms: s.alarms.filter(a => a.id !== id) }));
      },
      toggleAlarm: id => {
        const current = get().alarms.find(a => a.id === id);
        if (!current) return;
        const nextEnabled = !current.enabled;
        set(s => ({
          alarms: s.alarms.map(a =>
            a.id === id ? { ...a, enabled: nextEnabled } : a,
          ),
        }));
        if (nextEnabled) {
          NativeAlarm.scheduleAlarm({ ...current, enabled: true }).then(ok => {
            if (!ok) {
              set(s => ({
                alarms: s.alarms.map(a =>
                  a.id === id ? { ...a, enabled: false } : a,
                ),
              }));
            }
          });
        } else {
          NativeAlarm.cancelAlarm(id);
        }
      },
      snoozeAlarm: (id, intervalMin) => {
        set(s => ({
          alarms: s.alarms.map(a =>
            a.id === id
              ? { ...a, snoozedUntil: Date.now() + intervalMin * 60 * 1000 }
              : a,
          ),
        }));
      },
      clearSnooze: id => {
        set(s => ({
          alarms: s.alarms.map(a =>
            a.id === id ? { ...a, snoozedUntil: undefined } : a,
          ),
        }));
      },
      dismissSnooze: id => {
        set(s => ({
          alarms: s.alarms.map(a => {
            if (a.id !== id) return a;
            const isRepeating = a.repeatDays && a.repeatDays.length > 0;
            return {
              ...a,
              enabled: isRepeating ? a.enabled : false,
              snoozedUntil: undefined,
            };
          }),
        }));
      },
      rescheduleAll: () => {
        const { alarms } = get();
        for (const alarm of alarms) {
          if (alarm.enabled) {
            NativeAlarm.scheduleAlarm(alarm).then(ok => {
              if (!ok) {
                set(s => ({
                  alarms: s.alarms.map(item =>
                    item.id === alarm.id ? { ...item, enabled: false } : item,
                  ),
                }));
              }
            });
          }
        }
      },
      syncFromNative: async () => {
        const native = await NativeAlarm.listAlarms();
        if (native.length === 0) return;
        set(s => {
          if (s.alarms.length === 0) {
            const hydrated: Alarm[] = native.map(row => ({
              id: row.id,
              hour: row.hour ?? 7,
              minute: row.minute ?? 0,
              label: row.label ?? 'Alarm',
              repeatDays: row.repeatDays ?? [],
              enabled: row.enabled,
              soundId: row.soundId ?? 'default',
              volume: row.volume ?? 1.0,
              vibrate: row.vibrate ?? true,
              snooze: row.snooze ?? {
                enabled: true,
                intervalMin: 5,
                maxCount: row.snoozeMaxCount ?? 3,
              },
              missions: (row.missions ?? []) as any,
              wallpaper: row.wallpaper,
              snoozedUntil: row.snoozeUsed > 0 ? row.triggerTimeMs : undefined,
              gentleWakeup: true,
              photoReferencePath: row.photoReferencePath,
              photoMatchThreshold: row.photoMatchThreshold ?? 72,
              barcodeValue: row.barcodeValue,
              stepTarget: row.stepTarget ?? 5,
              squatTarget: row.squatTarget ?? 3,
              shakeTarget: row.shakeTarget ?? 5,
              mathCount: row.mathCount ?? 2,
              mathDifficulty: row.mathDifficulty ?? 'normal',
              memoryPairs: row.memoryPairs ?? 6,
              typingPhrase: row.typingPhrase,
            }));
            return { alarms: hydrated };
          }

          return {
            alarms: s.alarms.map(alarm => {
              const match = native.find(row => row.id === alarm.id);
              if (!match) return alarm;
              return {
                ...alarm,
                enabled: match.enabled,
                snoozedUntil:
                  match.snoozeUsed > 0 ? match.triggerTimeMs : undefined,
              };
            }),
          };
        });
      },
    }),
    {
      name: 'alarms',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

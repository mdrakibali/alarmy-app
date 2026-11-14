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
  rescheduleAll: () => void;
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
          NativeAlarm.scheduleAlarm(newAlarm);
        }
        return id;
      },
      updateAlarm: (id, patch) => {
        set(s => {
          const nextAlarms = s.alarms.map(a =>
            a.id === id ? { ...a, ...patch } : a,
          );
          const updated = nextAlarms.find(a => a.id === id);
          if (updated) {
            if (updated.enabled) {
              NativeAlarm.scheduleAlarm(updated);
            } else {
              NativeAlarm.cancelAlarm(id);
            }
          }
          return { alarms: nextAlarms };
        });
      },
      removeAlarm: id => {
        NativeAlarm.cancelAlarm(id);
        set(s => ({ alarms: s.alarms.filter(a => a.id !== id) }));
      },
      toggleAlarm: id => {
        set(s => {
          const nextAlarms = s.alarms.map(a => {
            if (a.id === id) {
              const nextEnabled = !a.enabled;
              const nextAlarm = { ...a, enabled: nextEnabled };
              if (nextEnabled) {
                NativeAlarm.scheduleAlarm(nextAlarm);
              } else {
                NativeAlarm.cancelAlarm(id);
              }
              return nextAlarm;
            }
            return a;
          });
          return { alarms: nextAlarms };
        });
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
      rescheduleAll: () => {
        const { alarms } = get();
        for (const alarm of alarms) {
          if (alarm.enabled) {
            NativeAlarm.scheduleAlarm(alarm);
          }
        }
      },
    }),
    {
      name: 'alarms',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

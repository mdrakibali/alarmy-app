import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from '@/storage/mmkv';
import type { Alarm } from './types';

interface AlarmState {
  alarms: Alarm[];
  addAlarm: (alarm: Omit<Alarm, 'id'>) => string;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
}

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useAlarmStore = create<AlarmState>()(
  persist(
    set => ({
      alarms: [],
      addAlarm: alarm => {
        const id = newId();
        set(s => ({ alarms: [...s.alarms, { ...alarm, id }] }));
        return id;
      },
      updateAlarm: (id, patch) =>
        set(s => ({
          alarms: s.alarms.map(a => (a.id === id ? { ...a, ...patch } : a)),
        })),
      removeAlarm: id =>
        set(s => ({ alarms: s.alarms.filter(a => a.id !== id) })),
      toggleAlarm: id =>
        set(s => ({
          alarms: s.alarms.map(a =>
            a.id === id ? { ...a, enabled: !a.enabled } : a,
          ),
        })),
    }),
    {
      name: 'alarms',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

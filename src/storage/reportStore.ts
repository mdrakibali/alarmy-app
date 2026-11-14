import { create } from 'zustand';
import { storage } from './mmkv';
import { useMorningStore } from './morningStore';

export interface AlarmLogEntry {
  id: string;
  timestamp: number;
  label: string;
  scheduledTime: string;
  dismissedTime: string;
  onTime: boolean;
  missionsCompleted: string[];
  snoozeCount: number;
}

interface ReportState {
  logs: AlarmLogEntry[];
  logAlarmDismissed: (entry: Omit<AlarmLogEntry, 'id' | 'timestamp'>) => void;
  getWeeklyConsistency: () => { day: string; onTime: boolean; height: string }[];
  getSuccessRate: () => number;
  getAverageWakeupTime: () => string;
}

const STORAGE_KEY = 'alba_report_logs';

const generateDefaultLogs = (): AlarmLogEntry[] => {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  return [
    {
      id: 'log-1',
      timestamp: now - oneDay * 6,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:02 AM',
      onTime: true,
      missionsCompleted: ['shake'],
      snoozeCount: 0,
    },
    {
      id: 'log-2',
      timestamp: now - oneDay * 5,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:05 AM',
      onTime: true,
      missionsCompleted: ['math'],
      snoozeCount: 1,
    },
    {
      id: 'log-3',
      timestamp: now - oneDay * 4,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:35 AM',
      onTime: false,
      missionsCompleted: ['shake'],
      snoozeCount: 3,
    },
    {
      id: 'log-4',
      timestamp: now - oneDay * 3,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:03 AM',
      onTime: true,
      missionsCompleted: ['typing'],
      snoozeCount: 0,
    },
    {
      id: 'log-5',
      timestamp: now - oneDay * 2,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:00 AM',
      onTime: true,
      missionsCompleted: ['math'],
      snoozeCount: 0,
    },
    {
      id: 'log-6',
      timestamp: now - oneDay * 1,
      label: 'Wake up early',
      scheduledTime: '07:00 AM',
      dismissedTime: '07:08 AM',
      onTime: true,
      missionsCompleted: ['memory'],
      snoozeCount: 1,
    },
  ];
};

const loadLogs = (): AlarmLogEntry[] => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load report logs:', e);
  }
  return [];
};

const saveLogs = (logs: AlarmLogEntry[]) => {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(logs.slice(-30))); // Keep last 30 logs
  } catch (e) {
    console.warn('Failed to save report logs:', e);
  }
};

export const useReportStore = create<ReportState>((set, get) => {
  const initial = loadLogs();

  return {
    logs: initial,

    logAlarmDismissed: entry => {
      set(state => {
        const newEntry: AlarmLogEntry = {
          ...entry,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
        };
        const nextLogs = [...state.logs, newEntry];
        saveLogs(nextLogs);
        useMorningStore.getState().markAlarmDismissed();
        return { logs: nextLogs };
      });
    },

    getWeeklyConsistency: () => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const logs = get().logs;
      const today = new Date();
      const result: { day: string; onTime: boolean; height: string }[] = [];

      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dayStr = dayNames[d.getDay()];

        // Find log on this date
        const match = logs.find(l => {
          const lDate = new Date(l.timestamp);
          return (
            lDate.getDate() === d.getDate() &&
            lDate.getMonth() === d.getMonth() &&
            lDate.getFullYear() === d.getFullYear()
          );
        });

        if (match) {
          result.push({
            day: dayStr,
            onTime: match.onTime,
            height: match.onTime ? '90%' : '45%',
          });
        } else {
          result.push({
            day: dayStr,
            onTime: true,
            height: '75%',
          });
        }
      }

      return result;
    },

    getSuccessRate: () => {
      const logs = get().logs;
      if (logs.length === 0) return 100;
      const onTimeCount = logs.filter(l => l.onTime).length;
      return Math.round((onTimeCount / logs.length) * 100);
    },

    getAverageWakeupTime: () => {
      const logs = get().logs;
      if (logs.length === 0) return '7:00 AM';
      const recent = logs.slice(-7);
      const lastDismiss = recent[recent.length - 1];
      return lastDismiss ? lastDismiss.dismissedTime : '7:05 AM';
    },
  };
});


import { create } from 'zustand';
import { storage } from './mmkv';

const STORAGE_KEY = 'alba_active_mission_session_v1';

export interface ActiveMissionSession {
  alarmId: string;
  activeMissionIndex: number;
  completedMissions: string[];
  missions: string[];
  startedAt: number;
  lastUpdatedAt: number;
}

interface ActiveMissionState {
  session: ActiveMissionSession | null;
  startSession: (alarmId: string, missions: string[], startIndex?: number) => void;
  recordMissionCompleted: (alarmId: string, completedIndex: number, missionKey: string) => number;
  getActiveSession: (alarmId?: string) => {
    isInProgress: boolean;
    alarmId: string;
    currentIndex: number;
    currentMissionKey: string | null;
    completedMissions: string[];
    totalCount: number;
    missions: string[];
  } | null;
  clearSession: () => void;
}

const loadSession = (): ActiveMissionSession | null => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.alarmId || !Array.isArray(parsed.missions)) return null;
    return parsed as ActiveMissionSession;
  } catch {
    return null;
  }
};

const saveSession = (session: ActiveMissionSession | null) => {
  try {
    if (!session) {
      storage.remove(STORAGE_KEY);
    } else {
      storage.set(STORAGE_KEY, JSON.stringify(session));
    }
  } catch {}
};

export const useActiveMissionStore = create<ActiveMissionState>((set, get) => ({
  session: loadSession(),

  startSession: (alarmId: string, missions: string[], startIndex = 0) => {
    const current = get().session;
    // If the same alarm already has an active in-progress session, preserve progress
    if (
      current &&
      current.alarmId === alarmId &&
      current.activeMissionIndex < missions.length &&
      current.activeMissionIndex > 0
    ) {
      return;
    }

    const newSession: ActiveMissionSession = {
      alarmId,
      activeMissionIndex: startIndex,
      completedMissions: [],
      missions,
      startedAt: Date.now(),
      lastUpdatedAt: Date.now(),
    };
    saveSession(newSession);
    set({ session: newSession });
  },

  recordMissionCompleted: (alarmId: string, completedIndex: number, missionKey: string) => {
    const current = get().session;
    const missions = current?.missions ?? [];
    const completed = new Set(current?.completedMissions ?? []);
    if (missionKey) {
      completed.add(missionKey);
    }

    const nextIdx = Math.max(completedIndex + 1, (current?.activeMissionIndex ?? 0) + 1);

    if (nextIdx >= missions.length) {
      // All missions completed
      saveSession(null);
      set({ session: null });
      return nextIdx;
    }

    const updatedSession: ActiveMissionSession = {
      alarmId: current?.alarmId || alarmId,
      activeMissionIndex: nextIdx,
      completedMissions: Array.from(completed),
      missions: missions.length > 0 ? missions : [missionKey],
      startedAt: current?.startedAt || Date.now(),
      lastUpdatedAt: Date.now(),
    };
    saveSession(updatedSession);
    set({ session: updatedSession });
    return nextIdx;
  },

  getActiveSession: (alarmId?: string) => {
    const current = get().session;
    if (!current) return null;
    if (alarmId && current.alarmId !== alarmId) return null;
    if (current.activeMissionIndex >= current.missions.length) {
      return null;
    }
    const currentKey = current.missions[current.activeMissionIndex] ?? null;
    return {
      isInProgress: true,
      alarmId: current.alarmId,
      currentIndex: current.activeMissionIndex,
      currentMissionKey: currentKey,
      completedMissions: current.completedMissions,
      totalCount: current.missions.length,
      missions: current.missions,
    };
  },

  clearSession: () => {
    saveSession(null);
    set({ session: null });
  },
}));

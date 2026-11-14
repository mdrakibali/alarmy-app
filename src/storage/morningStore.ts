import { create } from 'zustand';
import { storage } from './mmkv';

export interface RoutineItem {
  id: string;
  label: string;
  icon: string;
}

export const DEFAULT_ROUTINES: RoutineItem[] = [
  { id: 'water', label: 'Drink a glass of warm water', icon: '💧' },
  { id: 'stretch', label: '5-minute full body stretch', icon: '🧘' },
  { id: 'sunlight', label: 'Get direct natural sunlight for 10 mins', icon: '☀️' },
  { id: 'plan', label: 'Review today’s top 3 high-impact goals', icon: '🎯' },
  { id: 'bed', label: 'Make bed & tidy morning space', icon: '🛏️' },
];

export const DAILY_QUOTES = [
  { quote: 'Every morning you have two choices: continue to sleep with your dreams, or wake up and chase them.', author: 'Carmelo Anthony' },
  { quote: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { quote: 'Your future is created by what you do today, not tomorrow.', author: 'Robert Kiyosaki' },
  { quote: 'Wake up with determination. Go to bed with satisfaction.', author: 'George Horace Lorimer' },
  { quote: 'Opportunities don’t happen, you create them.', author: 'Chris Grosser' },
];

interface MorningState {
  completedItems: string[];
  streakDays: number;
  lastActiveDate: string;
  quoteIndex: number;

  toggleRoutine: (id: string) => void;
  incrementStreak: () => void;
  nextQuote: () => void;
}

const STORAGE_KEY = 'alba_morning_state';

const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const defaultState = {
  completedItems: ['water'],
  streakDays: 5,
  lastActiveDate: getTodayString(),
  quoteIndex: 0,
};

const loadState = () => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const today = getTodayString();
      // If the date has changed, reset completedItems for the new day
      if (parsed.lastActiveDate !== today) {
        return {
          ...parsed,
          completedItems: [],
          lastActiveDate: today,
          quoteIndex: (parsed.quoteIndex + 1) % DAILY_QUOTES.length,
        };
      }
      return { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load morning state:', e);
  }
  return defaultState;
};

const saveState = (state: Partial<MorningState>) => {
  try {
    storage.set(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save morning state:', e);
  }
};

export const useMorningStore = create<MorningState>((set, get) => {
  const initial = loadState();

  return {
    ...initial,

    toggleRoutine: id => {
      set(state => {
        const has = state.completedItems.includes(id);
        const next = has
          ? state.completedItems.filter(item => item !== id)
          : [...state.completedItems, id];
        const updated = { completedItems: next, lastActiveDate: getTodayString() };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    incrementStreak: () => {
      set(state => {
        const nextStreak = state.streakDays + 1;
        const updated = { streakDays: nextStreak, lastActiveDate: getTodayString() };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    nextQuote: () => {
      set(state => {
        const nextIndex = (state.quoteIndex + 1) % DAILY_QUOTES.length;
        const updated = { quoteIndex: nextIndex };
        saveState({ ...state, ...updated });
        return updated;
      });
    },
  };
});


import { create } from 'zustand';
import { storage } from './mmkv';

export type BackgroundTarget =
  | 'all'
  | 'home'
  | 'alarm'
  | 'ringing'
  | 'sleep'
  | 'mission';

interface ThemeState {
  homeBackground: string;
  alarmBackground: string;
  ringingBackground: string;
  sleepBackground: string;
  missionBackground: string;
  brightness: number;
  overlayOpacity: number;
  customImages: string[];

  setBackground: (target: BackgroundTarget, backgroundId: string) => void;
  setBrightness: (brightness: number) => void;
  setOverlayOpacity: (opacity: number) => void;
  addCustomImage: (uri: string) => void;
  resetTheme: () => void;
}

const STORAGE_KEY = 'alarmy_theme_settings';

const defaultState = {
  homeBackground: 'gradient',
  alarmBackground: 'minimal',
  ringingBackground: 'sunrise',
  sleepBackground: 'night_sky',
  missionBackground: 'minimal',
  brightness: 1.0,
  overlayOpacity: 0.1,
  customImages: [],
};

const loadState = () => {
  try {
    const raw = storage.getString(STORAGE_KEY);
    if (raw) {
      return { ...defaultState, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load theme state from MMKV:', e);
  }
  return defaultState;
};

const saveState = (state: Partial<ThemeState>) => {
  try {
    const data = {
      homeBackground: state.homeBackground,
      alarmBackground: state.alarmBackground,
      ringingBackground: state.ringingBackground,
      sleepBackground: state.sleepBackground,
      missionBackground: state.missionBackground,
      brightness: state.brightness,
      overlayOpacity: state.overlayOpacity,
      customImages: state.customImages,
    };
    storage.set(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save theme state to MMKV:', e);
  }
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initial = loadState();

  return {
    ...initial,

    setBackground: (target, backgroundId) => {
      set(state => {
        let updated: Partial<ThemeState> = {};
        if (target === 'all') {
          updated = {
            homeBackground: backgroundId,
            alarmBackground: backgroundId,
            ringingBackground: backgroundId,
            sleepBackground: backgroundId,
            missionBackground: backgroundId,
          };
        } else if (target === 'home') {
          updated = { homeBackground: backgroundId };
        } else if (target === 'alarm') {
          updated = { alarmBackground: backgroundId };
        } else if (target === 'ringing') {
          updated = { ringingBackground: backgroundId };
        } else if (target === 'sleep') {
          updated = { sleepBackground: backgroundId };
        } else if (target === 'mission') {
          updated = { missionBackground: backgroundId };
        }

        const newState = { ...state, ...updated };
        saveState(newState);
        return updated;
      });
    },

    setBrightness: brightness => {
      set(state => {
        const clamped = Math.max(0.2, Math.min(1.0, brightness));
        const updated = { brightness: clamped };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    setOverlayOpacity: overlayOpacity => {
      set(state => {
        const clamped = Math.max(0.0, Math.min(0.8, overlayOpacity));
        const updated = { overlayOpacity: clamped };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    addCustomImage: uri => {
      set(state => {
        const customImages = [uri, ...state.customImages.filter(u => u !== uri)];
        const updated = { customImages };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    resetTheme: () => {
      set(() => {
        saveState(defaultState);
        return { ...defaultState };
      });
    },
  };
});

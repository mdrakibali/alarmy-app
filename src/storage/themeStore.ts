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
  favorites: string[];
  recentlyViewed: string[];

  setBackground: (target: BackgroundTarget, backgroundId: string) => void;
  setBrightness: (brightness: number) => void;
  setOverlayOpacity: (opacity: number) => void;
  addCustomImage: (uri: string) => void;
  toggleFavorite: (wallpaperId: string) => void;
  addRecentlyViewed: (wallpaperId: string) => void;
  resetTheme: () => void;
}

const STORAGE_KEY = 'alarmy_theme_settings';

const defaultState = {
  homeBackground: 'trending_dancing_cat',
  alarmBackground: 'trending_dancing_cat',
  ringingBackground: 'trending_dancing_cat',
  sleepBackground: 'galaxy_nebula_swirl',
  missionBackground: 'trending_dancing_cat',
  brightness: 1.0,
  overlayOpacity: 0.15,
  customImages: [],
  favorites: ['trending_dancing_cat', 'kpop_stage', 'motivation_sunrise'],
  recentlyViewed: ['trending_dancing_cat', 'kpop_stage'],
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
      favorites: state.favorites,
      recentlyViewed: state.recentlyViewed,
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

    toggleFavorite: wallpaperId => {
      set(state => {
        const has = state.favorites.includes(wallpaperId);
        const favorites = has
          ? state.favorites.filter(id => id !== wallpaperId)
          : [wallpaperId, ...state.favorites];
        const updated = { favorites };
        saveState({ ...state, ...updated });
        return updated;
      });
    },

    addRecentlyViewed: wallpaperId => {
      set(state => {
        const filtered = state.recentlyViewed.filter(id => id !== wallpaperId);
        const recentlyViewed = [wallpaperId, ...filtered].slice(0, 10);
        const updated = { recentlyViewed };
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

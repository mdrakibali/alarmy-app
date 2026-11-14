import { ALARM_SOUND_ITEMS } from '@/data/alarmSounds';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { SLEEP_MUSIC_ITEMS } from '@/data/sleepMusic';
import { useThemeStore } from '@/storage/themeStore';

describe('Media and Theme System', () => {
  it('should have 10 valid alarm sounds with metadata', () => {
    expect(ALARM_SOUND_ITEMS.length).toBeGreaterThanOrEqual(10);
    ALARM_SOUND_ITEMS.forEach(sound => {
      expect(sound.id).toMatch(/^alarm_/);
      expect(sound.title).toBeTruthy();
      expect(sound.durationSec).toBeGreaterThan(0);
    });
  });

  it('should have 13 valid sleep music tracks with metadata', () => {
    expect(SLEEP_MUSIC_ITEMS.length).toBeGreaterThanOrEqual(13);
    SLEEP_MUSIC_ITEMS.forEach(music => {
      expect(music.id).toMatch(/^sleep_/);
      expect(music.title).toBeTruthy();
      expect(music.durationSec).toBeGreaterThan(0);
      expect(music.loopable).toBe(true);
    });
  });

  it('should have curated background wallpaper collection', () => {
    expect(BACKGROUND_ITEMS.length).toBeGreaterThanOrEqual(10);
    BACKGROUND_ITEMS.forEach(bg => {
      expect(bg.id).toBeTruthy();
      expect(bg.name).toBeTruthy();
      expect(bg.source).toBeDefined();
    });
  });

  it('should manage theme state and allow setting target backgrounds', () => {
    const store = useThemeStore.getState();

    store.setBackground('all', 'sunrise');
    const state1 = useThemeStore.getState();
    expect(state1.homeBackground).toBe('sunrise');
    expect(state1.alarmBackground).toBe('sunrise');
    expect(state1.sleepBackground).toBe('sunrise');

    store.setBackground('sleep', 'night_sky');
    const state2 = useThemeStore.getState();
    expect(state2.sleepBackground).toBe('night_sky');
    expect(state2.homeBackground).toBe('sunrise');

    store.setBrightness(0.7);
    expect(useThemeStore.getState().brightness).toBe(0.7);

    store.setOverlayOpacity(0.25);
    expect(useThemeStore.getState().overlayOpacity).toBe(0.25);
  });
});

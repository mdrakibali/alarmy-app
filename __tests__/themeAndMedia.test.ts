import { ALARM_SOUND_ITEMS } from '@/data/alarmSounds';
import { SLEEP_MUSIC_ITEMS } from '@/data/sleepMusic';
import { WALLPAPERS, WALLPAPER_CATEGORIES } from '@/data/wallpapers';
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

  it('should have all 12 requested wallpaper categories', () => {
    expect(WALLPAPER_CATEGORIES.length).toBe(12);
    const expectedCategories = [
      'KPOP Trending',
      'Trending',
      'Daily Motivation',
      'Anime',
      'Cute Animals',
      'Funny Memes',
      'Nature',
      'Aesthetic',
      'Galaxy',
      'Love & Romance',
      'Gaming',
      'Minimal Animation',
    ];

    expectedCategories.forEach(cat => {
      const found = WALLPAPER_CATEGORIES.some(c => c.name === cat);
      expect(found).toBe(true);
    });
  });

  it('should have multiple animated GIF wallpapers for each category', () => {
    expect(WALLPAPERS.length).toBeGreaterThanOrEqual(24);

    WALLPAPER_CATEGORIES.forEach(cat => {
      const inCat = WALLPAPERS.filter(w => w.category === cat.name);
      expect(inCat.length).toBeGreaterThanOrEqual(2);
    });

    WALLPAPERS.forEach(w => {
      expect(w.id).toBeTruthy();
      expect(w.name).toBeTruthy();
      expect(w.category).toBeTruthy();
      expect(w.source).toBeDefined();
      expect(w.duration).toBe('Looping GIF');
      expect(w.attribution).toBeTruthy();
      expect(w.license).toBeTruthy();
    });
  });

  it('should manage theme state and allow setting target backgrounds', () => {
    const store = useThemeStore.getState();

    store.setBackground('all', 'trending_dancing_cat');
    const state1 = useThemeStore.getState();
    expect(state1.homeBackground).toBe('trending_dancing_cat');
    expect(state1.alarmBackground).toBe('trending_dancing_cat');
    expect(state1.sleepBackground).toBe('trending_dancing_cat');

    store.setBackground('sleep', 'galaxy_nebula_swirl');
    const state2 = useThemeStore.getState();
    expect(state2.sleepBackground).toBe('galaxy_nebula_swirl');
    expect(state2.homeBackground).toBe('trending_dancing_cat');

    store.setBrightness(0.7);
    expect(useThemeStore.getState().brightness).toBe(0.7);

    store.setOverlayOpacity(0.25);
    expect(useThemeStore.getState().overlayOpacity).toBe(0.25);

    // Test favorites & recently viewed
    store.toggleFavorite('anime_sakura');
    expect(useThemeStore.getState().favorites).toContain('anime_sakura');
    store.toggleFavorite('anime_sakura');
    expect(useThemeStore.getState().favorites).not.toContain('anime_sakura');

    store.addRecentlyViewed('anime_sakura');
    expect(useThemeStore.getState().recentlyViewed[0]).toBe('anime_sakura');
  });
});

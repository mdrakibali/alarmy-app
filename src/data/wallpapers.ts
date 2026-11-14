export type WallpaperCategory =
  | 'KPOP Trending'
  | 'Trending'
  | 'Daily Motivation'
  | 'Anime'
  | 'Cute Animals'
  | 'Funny Memes'
  | 'Nature'
  | 'Aesthetic'
  | 'Galaxy'
  | 'Love & Romance'
  | 'Gaming'
  | 'Minimal Animation';

export interface WallpaperItem {
  id: string;
  name: string;
  category: WallpaperCategory;
  source: any;
  soundId?: string;
  soundName?: string;
  duration: string;
  isFavorite?: boolean;
  attribution: string;
  license: string;
  accentColor: string;
}

export const WALLPAPER_CATEGORIES: {
  id: WallpaperCategory;
  name: string;
  icon: string;
}[] = [
  { id: 'KPOP Trending', name: 'KPOP Trending', icon: '🔮' },
  { id: 'Trending', name: 'Trending', icon: '💖' },
  { id: 'Daily Motivation', name: 'Daily Motivation', icon: '🔥' },
  { id: 'Anime', name: 'Anime', icon: '⚡' },
  { id: 'Cute Animals', name: 'Cute Animals', icon: '🐾' },
  { id: 'Funny Memes', name: 'Funny Memes', icon: '😂' },
  { id: 'Nature', name: 'Nature', icon: '🌿' },
  { id: 'Aesthetic', name: 'Aesthetic', icon: '✨' },
  { id: 'Galaxy', name: 'Galaxy', icon: '🌌' },
  { id: 'Love & Romance', name: 'Love & Romance', icon: '💕' },
  { id: 'Gaming', name: 'Gaming', icon: '🎮' },
  { id: 'Minimal Animation', name: 'Minimal Animation', icon: '⚪' },
];

export const WALLPAPERS: WallpaperItem[] = [
  // 1. KPOP Trending
  {
    id: 'kpop_stage',
    name: 'ILLIT Stage',
    category: 'KPOP Trending',
    source: require('../assets/wallpapers/kpop/kpop_stage.gif'),
    soundId: 'alarm_electronic',
    soundName: "[ILLIT] You're Under Arrest",
    duration: 'Looping GIF',
    attribution: 'Original KPOP Stage Synth by AlarmyClone',
    license: 'Royalty Free / Original Asset',
    accentColor: '#D8B4FE',
  },
  {
    id: 'kpop_heart',
    name: 'WONHEE Heart Pulse',
    category: 'KPOP Trending',
    source: require('../assets/wallpapers/kpop/kpop_heart.gif'),
    soundId: 'alarm_electronic',
    soundName: '[ILLIT] WONHEE Solo Beat',
    duration: 'Looping GIF',
    attribution: 'Original KPOP Heart Animation',
    license: 'Royalty Free / Original Asset',
    accentColor: '#F472B6',
  },

  // 2. Trending
  {
    id: 'trending_dancing_cat',
    name: 'Dancing Cat',
    category: 'Trending',
    source: require('../assets/wallpapers/trending/trending_dancing_cat.gif'),
    soundId: 'alarm_rooster',
    soundName: 'Video sound',
    duration: 'Looping GIF',
    attribution: 'Original Dancing Cat Animation',
    license: 'Royalty Free / Original Asset',
    accentColor: '#F59E0B',
  },
  {
    id: 'trending_glitch',
    name: 'Neon Glitch Pulse',
    category: 'Trending',
    source: require('../assets/wallpapers/trending/trending_glitch.gif'),
    soundId: 'alarm_siren',
    soundName: 'Cyber Alert Wave',
    duration: 'Looping GIF',
    attribution: 'Procedural Cyber Glitch',
    license: 'Royalty Free / Original Asset',
    accentColor: '#8B5CF6',
  },

  // 3. Daily Motivation
  {
    id: 'motivation_sunrise',
    name: 'Golden Mountain Dawn',
    category: 'Daily Motivation',
    source: require('../assets/wallpapers/motivation/motivation_sunrise.gif'),
    soundId: 'alarm_gentle',
    soundName: 'Morning Awakening Chimes',
    duration: 'Looping GIF',
    attribution: 'Radiant Morning Sun Rays',
    license: 'Royalty Free / Original Asset',
    accentColor: '#EA580C',
  },
  {
    id: 'motivation_fire',
    name: 'Rising Motivation Embers',
    category: 'Daily Motivation',
    source: require('../assets/wallpapers/motivation/motivation_fire.gif'),
    soundId: 'alarm_emergency',
    soundName: 'Inner Fire Pulse',
    duration: 'Looping GIF',
    attribution: 'Energetic Fire Embers',
    license: 'Royalty Free / Original Asset',
    accentColor: '#EF4444',
  },

  // 4. Anime
  {
    id: 'anime_sakura',
    name: 'Falling Sakura Petals',
    category: 'Anime',
    source: require('../assets/wallpapers/anime/anime_sakura.gif'),
    soundId: 'alarm_piano',
    soundName: 'Acoustic Anime Melodies',
    duration: 'Looping GIF',
    attribution: 'Drifting Cherry Blossom Petals',
    license: 'Royalty Free / Original Asset',
    accentColor: '#FBCFE8',
  },
  {
    id: 'anime_speed_lines',
    name: 'Shonen Speed Burst',
    category: 'Anime',
    source: require('../assets/wallpapers/anime/anime_speed_lines.gif'),
    soundId: 'alarm_siren',
    soundName: 'Anime Battle Alert',
    duration: 'Looping GIF',
    attribution: 'High-Speed Action Lines',
    license: 'Royalty Free / Original Asset',
    accentColor: '#38BDF8',
  },

  // 5. Cute Animals
  {
    id: 'animals_corgi',
    name: 'Happy Bouncing Corgi',
    category: 'Cute Animals',
    source: require('../assets/wallpapers/animals/animals_corgi.gif'),
    soundId: 'alarm_birds',
    soundName: 'Morning Birdsong',
    duration: 'Looping GIF',
    attribution: 'Happy Puppy Morning Dance',
    license: 'Royalty Free / Original Asset',
    accentColor: '#F97316',
  },
  {
    id: 'animals_sleepy_fox',
    name: 'Sleepy Moon Fox',
    category: 'Cute Animals',
    source: require('../assets/wallpapers/animals/animals_sleepy_fox.gif'),
    soundId: 'alarm_gentle',
    soundName: 'Gentle Fox Lullaby',
    duration: 'Looping GIF',
    attribution: 'Serene Sleeping Fox',
    license: 'Royalty Free / Original Asset',
    accentColor: '#6366F1',
  },

  // 6. Funny Memes
  {
    id: 'memes_screaming_cat',
    name: 'Screaming Cat Rave',
    category: 'Funny Memes',
    source: require('../assets/wallpapers/memes/memes_screaming_cat.gif'),
    soundId: 'alarm_siren',
    soundName: 'Screaming Alarm',
    duration: 'Looping GIF',
    attribution: 'Meme Cat Strobe Rave',
    license: 'Royalty Free / Original Asset',
    accentColor: '#EF4444',
  },
  {
    id: 'memes_party_parrot',
    name: 'Disco Party Lights',
    category: 'Funny Memes',
    source: require('../assets/wallpapers/memes/memes_party_parrot.gif'),
    soundId: 'alarm_electronic',
    soundName: 'Party Club Rhythm',
    duration: 'Looping GIF',
    attribution: 'Multi-Color Party Disco',
    license: 'Royalty Free / Original Asset',
    accentColor: '#10B981',
  },

  // 7. Nature
  {
    id: 'nature_ocean_waves',
    name: 'Tropical Ocean Waves',
    category: 'Nature',
    source: require('../assets/wallpapers/nature/nature_ocean_waves.gif'),
    soundId: 'alarm_gentle',
    soundName: 'Sea Foam Breeze',
    duration: 'Looping GIF',
    attribution: 'Rolling Turquoise Beach Waves',
    license: 'Royalty Free / Original Asset',
    accentColor: '#06B6D4',
  },
  {
    id: 'nature_forest_rain',
    name: 'Mist Rain Forest',
    category: 'Nature',
    source: require('../assets/wallpapers/nature/nature_forest_rain.gif'),
    soundId: 'alarm_birds',
    soundName: 'Forest Songbirds in Rain',
    duration: 'Looping GIF',
    attribution: 'Gentle Woodland Rainfall',
    license: 'Royalty Free / Original Asset',
    accentColor: '#15803D',
  },

  // 8. Aesthetic
  {
    id: 'aesthetic_vaporwave',
    name: 'Retro 80s Cyber Grid',
    category: 'Aesthetic',
    source: require('../assets/wallpapers/aesthetic/aesthetic_vaporwave.gif'),
    soundId: 'alarm_electronic',
    soundName: 'Synthwave Horizon',
    duration: 'Looping GIF',
    attribution: 'Outrun Synth Grid Sunset',
    license: 'Royalty Free / Original Asset',
    accentColor: '#EC4899',
  },
  {
    id: 'aesthetic_pastel_clouds',
    name: 'Dreamy Pastel Sunset',
    category: 'Aesthetic',
    source: require('../assets/wallpapers/aesthetic/aesthetic_pastel_clouds.gif'),
    soundId: 'alarm_piano',
    soundName: 'Acoustic Sunset Melody',
    duration: 'Looping GIF',
    attribution: 'Drifting Candy Cloudscape',
    license: 'Royalty Free / Original Asset',
    accentColor: '#C084FC',
  },

  // 9. Galaxy
  {
    id: 'galaxy_nebula_swirl',
    name: 'Cosmic Violet Nebula',
    category: 'Galaxy',
    source: require('../assets/wallpapers/galaxy/galaxy_nebula_swirl.gif'),
    soundId: 'alarm_electronic',
    soundName: 'Deep Space Drone',
    duration: 'Looping GIF',
    attribution: 'Spiral Cosmic Nebula',
    license: 'Royalty Free / Original Asset',
    accentColor: '#7C3AED',
  },
  {
    id: 'galaxy_shooting_star',
    name: 'Shooting Star Night',
    category: 'Galaxy',
    source: require('../assets/wallpapers/galaxy/galaxy_shooting_star.gif'),
    soundId: 'alarm_bell',
    soundName: 'Temple Star Chimes',
    duration: 'Looping GIF',
    attribution: 'Starlight Meteor Shower',
    license: 'Royalty Free / Original Asset',
    accentColor: '#3B82F6',
  },

  // 10. Love & Romance
  {
    id: 'romance_floating_hearts',
    name: 'Floating Hearts',
    category: 'Love & Romance',
    source: require('../assets/wallpapers/romance/romance_floating_hearts.gif'),
    soundId: 'alarm_piano',
    soundName: 'Gentle Romance Piano',
    duration: 'Looping GIF',
    attribution: 'Ascending Soft Neon Hearts',
    license: 'Royalty Free / Original Asset',
    accentColor: '#F43F5E',
  },
  {
    id: 'romance_candlelight',
    name: 'Warm Candlelight Glow',
    category: 'Love & Romance',
    source: require('../assets/wallpapers/romance/romance_candlelight.gif'),
    soundId: 'alarm_gentle',
    soundName: 'Acoustic Hearth Serenade',
    duration: 'Looping GIF',
    attribution: 'Gentle Flickering Candle',
    license: 'Royalty Free / Original Asset',
    accentColor: '#F59E0B',
  },

  // 11. Gaming
  {
    id: 'gaming_pixel_dungeon',
    name: '8-Bit Golden Coin',
    category: 'Gaming',
    source: require('../assets/wallpapers/gaming/gaming_pixel_dungeon.gif'),
    soundId: 'alarm_digital',
    soundName: 'Arcade Digital Beep',
    duration: 'Looping GIF',
    attribution: 'Retro Spinning Pixel Coin',
    license: 'Royalty Free / Original Asset',
    accentColor: '#EAB308',
  },
  {
    id: 'gaming_cyber_grid',
    name: 'Cyberpunk Matrix Wave',
    category: 'Gaming',
    source: require('../assets/wallpapers/gaming/gaming_cyber_grid.gif'),
    soundId: 'alarm_electronic',
    soundName: 'Cyber Matrix Pulse',
    duration: 'Looping GIF',
    attribution: 'Digital Grid Wave Matrix',
    license: 'Royalty Free / Original Asset',
    accentColor: '#10B981',
  },

  // 12. Minimal Animation
  {
    id: 'minimal_pulse_circle',
    name: 'Zen Breathing Circle',
    category: 'Minimal Animation',
    source: require('../assets/wallpapers/minimal/minimal_pulse_circle.gif'),
    soundId: 'alarm_classic',
    soundName: 'Mindful Morning Bell',
    duration: 'Looping GIF',
    attribution: 'Minimalist Focus Ring',
    license: 'Royalty Free / Original Asset',
    accentColor: '#FF385C',
  },
  {
    id: 'minimal_gradient_drift',
    name: 'Soft Slate Drift',
    category: 'Minimal Animation',
    source: require('../assets/wallpapers/minimal/minimal_gradient_drift.gif'),
    soundId: 'alarm_bell',
    soundName: 'Calm Slate Resonance',
    duration: 'Looping GIF',
    attribution: 'Ambient Color Shift',
    license: 'Royalty Free / Original Asset',
    accentColor: '#94A3B8',
  },
];

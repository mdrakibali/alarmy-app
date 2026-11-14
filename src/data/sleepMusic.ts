export type SleepMusicCategory =
  | 'All'
  | 'Nature'
  | 'Noise'
  | 'Meditation'
  | 'Ambient'
  | 'Music';

export interface SleepMusicItem {
  id: string; // matches android res/raw/<id>
  title: string;
  category: SleepMusicCategory;
  durationSec: number;
  icon: string;
  description: string;
  loopable: boolean;
}

export const SLEEP_MUSIC_ITEMS: SleepMusicItem[] = [
  {
    id: 'sleep_rain',
    title: 'Rain on Window',
    category: 'Nature',
    durationSec: 8,
    icon: '🌧️',
    description: 'Gentle steady rainfall with soft water droplets',
    loopable: true,
  },
  {
    id: 'sleep_ocean',
    title: 'Ocean Waves',
    category: 'Nature',
    durationSec: 8,
    icon: '🌊',
    description: 'Rhythmic sea waves washing softly onto a sandy shore',
    loopable: true,
  },
  {
    id: 'sleep_forest',
    title: 'Forest Night',
    category: 'Nature',
    durationSec: 8,
    icon: '🌲',
    description: 'Tranquil woodland breeze with distant crickets',
    loopable: true,
  },
  {
    id: 'sleep_wind',
    title: 'Mountain Wind',
    category: 'Nature',
    durationSec: 8,
    icon: '💨',
    description: 'Soothing mountain breeze blowing through pine trees',
    loopable: true,
  },
  {
    id: 'sleep_thunderstorm',
    title: 'Thunderstorm',
    category: 'Nature',
    durationSec: 8,
    icon: '⛈️',
    description: 'Distant rolling thunder accompanied by calm rain',
    loopable: true,
  },
  {
    id: 'sleep_fireplace',
    title: 'Cozy Fireplace',
    category: 'Ambient',
    durationSec: 8,
    icon: '🔥',
    description: 'Warm glowing hearth embers and gentle wood crackles',
    loopable: true,
  },
  {
    id: 'sleep_whitenoise',
    title: 'White Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '📻',
    description: 'Even static noise for sleep masking and focus',
    loopable: true,
  },
  {
    id: 'sleep_pinknoise',
    title: 'Pink Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '🌸',
    description: 'Balanced 1/f deeper noise for restorative deep sleep',
    loopable: true,
  },
  {
    id: 'sleep_brownnoise',
    title: 'Brown Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '🪵',
    description: 'Warm low-frequency rumble to block traffic and noise',
    loopable: true,
  },
  {
    id: 'sleep_meditation',
    title: '432 Hz Tibetan Bowl',
    category: 'Meditation',
    durationSec: 8,
    icon: '🧘',
    description: 'Harmonic singing bowl tone with 4 Hz theta wave beat',
    loopable: true,
  },
  {
    id: 'sleep_piano',
    title: 'Piano Lullaby',
    category: 'Music',
    durationSec: 8,
    icon: '🎹',
    description: 'Slow soothing acoustic piano chords for falling asleep',
    loopable: true,
  },
  {
    id: 'sleep_ambient',
    title: 'Celestial Ambient',
    category: 'Ambient',
    durationSec: 8,
    icon: '✨',
    description: 'Dreamy evolving ethereal soundscape',
    loopable: true,
  },
  {
    id: 'sleep_relaxation',
    title: 'Zen River Stream',
    category: 'Nature',
    durationSec: 8,
    icon: '🏞️',
    description: 'Clear fresh water babbling gently over smooth pebbles',
    loopable: true,
  },
];


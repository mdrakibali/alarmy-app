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
    id: 'sleep_rain_gentle',
    title: 'Gentle Rain on Leaves',
    category: 'Nature',
    durationSec: 120,
    icon: '🌧️',
    description: 'Continuous soothing rain on lush forest leaves and window pane',
    loopable: true,
  },
  {
    id: 'sleep_ocean_surf',
    title: 'Pacific Ocean Surf',
    category: 'Nature',
    durationSec: 90,
    icon: '🌊',
    description: 'Relaxing rhythmic ocean tides rolling along a calm secluded coastline',
    loopable: true,
  },
  {
    id: 'sleep_forest_birds',
    title: 'Tranquil Forest Birds',
    category: 'Nature',
    durationSec: 60,
    icon: '🌲',
    description: 'Gentle woodland ambience with distant songbirds and soft wind',
    loopable: true,
  },
  {
    id: 'sleep_soft_piano',
    title: 'Serene Night Piano',
    category: 'Music',
    durationSec: 85,
    icon: '🎹',
    description: 'Gentle slow tempo acoustic piano lullaby designed for deep sleep',
    loopable: true,
  },
  {
    id: 'sleep_ambient_calm',
    title: 'Deep Sleep Drone',
    category: 'Ambient',
    durationSec: 100,
    icon: '🌌',
    description: 'Subtle warm ambient synth pads tuned to delta wave sleep frequencies',
    loopable: true,
  },
  {
    id: 'sleep_breeze_wind',
    title: 'Mountain Breeze',
    category: 'Nature',
    durationSec: 75,
    icon: '💨',
    description: 'Mellow pine forest breeze flowing across mountain slopes',
    loopable: true,
  },
  // Legacy items for complete compatibility
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
    id: 'sleep_whitenoise',
    title: 'White Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '📻',
    description: 'Pure static frequencies to mask intrusive ambient room sounds',
    loopable: true,
  },
  {
    id: 'sleep_brownnoise',
    title: 'Brown Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '🔊',
    description: 'Deep low-end rumble for profound physical relaxation',
    loopable: true,
  },
  {
    id: 'sleep_pinknoise',
    title: 'Pink Noise',
    category: 'Noise',
    durationSec: 6,
    icon: '🌸',
    description: 'Balanced frequency spectrum with enhanced natural warmth',
    loopable: true,
  },
];

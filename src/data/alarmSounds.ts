export type AlarmSoundCategory =
  | 'All'
  | 'Loud'
  | 'Classic'
  | 'Nature'
  | 'Gentle'
  | 'Trending';

export interface AlarmSoundItem {
  id: string; // matches android res/raw/<id>
  title: string;
  category: AlarmSoundCategory;
  durationSec: number;
  icon: string;
  description: string;
}

export const ALARM_SOUND_ITEMS: AlarmSoundItem[] = [
  {
    id: 'alarm_classic',
    title: 'Classic Alarm',
    category: 'Classic',
    durationSec: 5,
    icon: '⏰',
    description: 'Traditional twin-bell mechanical ringing pattern',
  },
  {
    id: 'alarm_digital',
    title: 'Digital Watch',
    category: 'Classic',
    durationSec: 4,
    icon: '⌚',
    description: 'Crisp digital clock beep sequence',
  },
  {
    id: 'alarm_siren',
    title: 'Loud Siren',
    category: 'Loud',
    durationSec: 5,
    icon: '🚨',
    description: 'Piercing dual-frequency sweep siren',
  },
  {
    id: 'alarm_emergency',
    title: 'Emergency Warning',
    category: 'Loud',
    durationSec: 4,
    icon: '⚡',
    description: 'Urgent high-impact warning tone',
  },
  {
    id: 'alarm_bell',
    title: 'Brass Bell',
    category: 'Classic',
    durationSec: 5,
    icon: '🔔',
    description: 'Resonant bell chime with deep acoustic sustain',
  },
  {
    id: 'alarm_rooster',
    title: 'Rooster Crow',
    category: 'Nature',
    durationSec: 5,
    icon: '🐓',
    description: 'Traditional energetic morning wake-up call',
  },
  {
    id: 'alarm_birds',
    title: 'Forest Birds',
    category: 'Nature',
    durationSec: 5,
    icon: '🐦',
    description: 'Gentle chirping and singing songbirds',
  },
  {
    id: 'alarm_gentle',
    title: 'Gentle Morning',
    category: 'Gentle',
    durationSec: 5,
    icon: '🍃',
    description: 'Peaceful acoustic chime sequence',
  },
  {
    id: 'alarm_piano',
    title: 'Warm Piano',
    category: 'Gentle',
    durationSec: 5,
    icon: '🎹',
    description: 'Uplifting major chord piano arpeggio',
  },
  {
    id: 'alarm_electronic',
    title: 'Electronic Beat',
    category: 'Trending',
    durationSec: 5,
    icon: '🎵',
    description: 'Modern energetic synthesizer arpeggiator',
  },
];

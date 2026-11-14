export type AlarmSoundCategory =
  | 'All'
  | 'Cinematic'
  | 'Gentle Morning'
  | 'Soft Piano'
  | 'Digital Alarm'
  | 'Electronic'
  | 'Nature'
  | 'Powerful Wake-up'
  | 'Classic Bell'
  | 'Classic'
  | 'Loud'
  | 'Gentle';

export interface AlarmSoundItem {
  id: string; // matches android res/raw/<id>
  title: string;
  category: AlarmSoundCategory;
  durationSec: number;
  icon: string;
  description: string;
}

export const ALARM_SOUND_ITEMS: AlarmSoundItem[] = [
  // 1. Cinematic
  {
    id: 'alarm_cinematic_horn',
    title: 'Cinematic Horn Rise',
    category: 'Cinematic',
    durationSec: 6,
    icon: '🎺',
    description: 'Deep orchestral brass crescendo that demands immediate attention',
  },
  {
    id: 'alarm_epic_countdown',
    title: 'Epic Countdown Alert',
    category: 'Cinematic',
    durationSec: 8,
    icon: '🎬',
    description: 'Hollywood action trailer percussion and dramatic tension sweep',
  },
  {
    id: 'alarm_space_transit',
    title: 'Space Station Alert',
    category: 'Cinematic',
    durationSec: 5,
    icon: '🚀',
    description: 'Deep space sci-fi airlock pressurization and resonant alert tone',
  },

  // 2. Gentle Morning
  {
    id: 'alarm_gentle_morning',
    title: 'Gentle Morning Chime',
    category: 'Gentle Morning',
    durationSec: 6,
    icon: '☀️',
    description: 'Sweet harmonic glockenspiel chimes for a peaceful wake-up transition',
  },
  {
    id: 'alarm_soft_wake',
    title: 'Soft Ambient Wake',
    category: 'Gentle Morning',
    durationSec: 5,
    icon: '🌸',
    description: 'Ethereal synth pad swells that ease you gently out of REM sleep',
  },
  {
    id: 'alarm_morning_breeze',
    title: 'Morning Breeze Melody',
    category: 'Gentle Morning',
    durationSec: 5,
    icon: '🍃',
    description: 'Delicate acoustic flute tones reminiscent of a sunny dawn garden',
  },

  // 3. Soft Piano
  {
    id: 'alarm_piano_medley',
    title: 'Acoustic Piano Chords',
    category: 'Soft Piano',
    durationSec: 6,
    icon: '🎹',
    description: 'Warm grand piano major progression recorded in concert hall acoustics',
  },
  {
    id: 'alarm_peaceful_keys',
    title: 'Peaceful Sunrise Keys',
    category: 'Soft Piano',
    durationSec: 5,
    icon: '🎼',
    description: 'Gentle contemplative piano motifs with soft natural room reverb',
  },
  {
    id: 'alarm_mellow_harmony',
    title: 'Mellow Piano Echo',
    category: 'Soft Piano',
    durationSec: 5,
    icon: '✨',
    description: 'Upbeat yet calming modern neoclassical piano arrangement',
  },

  // 4. Digital Alarm
  {
    id: 'alarm_digital_buzzer',
    title: 'Digital Clock Buzzer',
    category: 'Digital Alarm',
    durationSec: 5,
    icon: '⏰',
    description: 'The definitive 90s LED bedside clock dual-pulse alarm beep',
  },
  {
    id: 'alarm_digital_beeps',
    title: 'Fast Digital Beeps',
    category: 'Digital Alarm',
    durationSec: 6,
    icon: '📟',
    description: 'High-cadence tactical timer warning beeps to force alertness',
  },
  {
    id: 'alarm_arcade_bleep',
    title: 'Retro 8-Bit Wakeup',
    category: 'Digital Alarm',
    durationSec: 4,
    icon: '🕹️',
    description: 'Nostalgic game arcade synthesized bleep arpeggio',
  },
  {
    id: 'alarm_radar_ping',
    title: 'Futuristic Radar Ping',
    category: 'Digital Alarm',
    durationSec: 5,
    icon: '📡',
    description: 'Submarine sonar pulse with digital pitch modulation',
  },

  // 5. Electronic
  {
    id: 'alarm_electronic_pulse',
    title: 'Electronic Beat Alarm',
    category: 'Electronic',
    durationSec: 6,
    icon: '⚡',
    description: 'Pumping four-on-the-floor synth bass pattern to energize your morning',
  },
  {
    id: 'alarm_synth_alert',
    title: 'Synth Wave Alarm',
    category: 'Electronic',
    durationSec: 5,
    icon: '🎧',
    description: 'Retro 80s analog synthesizer lead with bright filtered saw waves',
  },
  {
    id: 'alarm_techno_riser',
    title: 'Cyber Riser Siren',
    category: 'Electronic',
    durationSec: 5,
    icon: '🤖',
    description: 'High energy festival buildup riser that snaps you awake instantly',
  },

  // 6. Nature
  {
    id: 'alarm_rooster_crow',
    title: 'Rooster Morning Crow',
    category: 'Nature',
    durationSec: 5,
    icon: '🐓',
    description: 'Authentic countryside rooster crowing herald of the new day',
  },
  {
    id: 'alarm_morning_birds',
    title: 'Singing Garden Birds',
    category: 'Nature',
    durationSec: 6,
    icon: '🐦',
    description: 'Lively spring birdsong recorded in high fidelity morning meadow',
  },
  {
    id: 'alarm_forest_dawn',
    title: 'Forest Dawn Chorus',
    category: 'Nature',
    durationSec: 6,
    icon: '🌲',
    description: 'Crisp mountain forest ambient birds and soft rustling pine trees',
  },

  // 7. Powerful Wake-up
  {
    id: 'alarm_facility_alert',
    title: 'Industrial Facility Siren',
    category: 'Powerful Wake-up',
    durationSec: 6,
    icon: '🚨',
    description: 'Heavy duty factory emergency siren designed to cut through deep sleep',
  },
  {
    id: 'alarm_police_siren',
    title: 'Emergency Warning Siren',
    category: 'Powerful Wake-up',
    durationSec: 7,
    icon: '🚒',
    description: 'Dual-tone urgent police siren sweep for extreme heavy sleepers',
  },
  {
    id: 'alarm_fire_bell',
    title: 'Loud Fire Alarm Horn',
    category: 'Powerful Wake-up',
    durationSec: 5,
    icon: '🔥',
    description: 'High-decibel building evacuation warning tone',
  },
  {
    id: 'alarm_extreme_danger',
    title: 'Heavy Duty Klaxon',
    category: 'Powerful Wake-up',
    durationSec: 5,
    icon: '⚡',
    description: 'Naval vessel general quarters alert klaxon horn',
  },

  // 8. Classic Bell
  {
    id: 'alarm_classic_clock',
    title: 'Classic Twin Bell Ring',
    category: 'Classic Bell',
    durationSec: 5,
    icon: '🔔',
    description: 'Real mechanical vintage twin brass bells striking rhythmically',
  },
  {
    id: 'alarm_service_bell',
    title: 'Brass Desk Bell',
    category: 'Classic Bell',
    durationSec: 4,
    icon: '🛎️',
    description: 'Clear resonant concierge service bell dings with bright ring',
  },
  {
    id: 'alarm_ship_bell',
    title: 'Nautical Bell Strike',
    category: 'Classic Bell',
    durationSec: 5,
    icon: '⚓',
    description: 'Heavy marine brass bell ringing off the morning nautical watch',
  },

  // Backwards compatibility for existing alarms
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
    id: 'alarm_rooster',
    title: 'Rooster Crow',
    category: 'Nature',
    durationSec: 4,
    icon: '🐓',
    description: 'Clear barnyard rooster morning call',
  },
];

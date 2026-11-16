export type AlarmSoundCategory =
  | 'All'
  | 'Gentle Morning'
  | 'Nature & Birds'
  | 'Ocean & Waterfall'
  | 'Rain & Thunder'
  | 'Soft Piano'
  | 'Acoustic Guitar'
  | 'Flute & Instrumental'
  | 'Meditation & Relaxing'
  | 'Digital Alarm'
  | 'Classic Bell'
  | 'Vintage Clock'
  | 'Energetic Wake Up'
  | 'Cinematic'
  | 'Ambient & Space'
  | 'Forest & Wildlife'
  | 'Loud & Urgent';

export interface AlarmSoundItem {
  id: string; // matches android res/raw/<id>
  title: string;
  category: AlarmSoundCategory;
  durationSec: number;
  icon: string;
  description: string;
}

export const ALARM_SOUND_ITEMS: AlarmSoundItem[] = [
  // --- 1. Gentle Morning ---
  {
    id: 'alarm_gentle_morning',
    title: 'Gentle Morning Glockenspiel',
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
  {
    id: 'alarm_golden_harp_arpeggio',
    title: 'Golden Harp Dawn Arpeggio',
    category: 'Gentle Morning',
    durationSec: 6,
    icon: '✨',
    description: 'Lush concert harp glissando rising gently like the morning sun',
  },
  {
    id: 'alarm_morning_carillon_chime',
    title: 'Morning Carillon Chime',
    category: 'Gentle Morning',
    durationSec: 7,
    icon: '🔔',
    description: 'Melodic European town bell carillon welcoming a brand new day',
  },

  // --- 2. Acoustic Guitar ---
  {
    id: 'alarm_acoustic_guitar_strum',
    title: 'Acoustic Guitar Strum',
    category: 'Acoustic Guitar',
    durationSec: 5,
    icon: '🎸',
    description: 'Warm folk acoustic guitar chord progression played with natural wood resonance',
  },
  {
    id: 'alarm_acoustic_guitar_morning',
    title: 'Warm Morning Fingerpicking',
    category: 'Acoustic Guitar',
    durationSec: 8,
    icon: '🎶',
    description: 'Intimate nylon-string acoustic fingerpicking with gentle morning feel',
  },

  // --- 3. Flute & Instrumental ---
  {
    id: 'alarm_zen_bamboo_flute',
    title: 'Zen Bamboo Flute',
    category: 'Flute & Instrumental',
    durationSec: 8,
    icon: '🎋',
    description: 'Meditative Shakuhachi bamboo flute melody evoking tranquil mountain mist',
  },
  {
    id: 'alarm_celtic_tin_whistle',
    title: 'Celtic Dawn Whistle',
    category: 'Flute & Instrumental',
    durationSec: 5,
    icon: '☘️',
    description: 'Bright Irish tin whistle melody full of warmth and joyful optimism',
  },

  // --- 4. Soft Piano ---
  {
    id: 'alarm_piano_medley',
    title: 'Acoustic Grand Piano Chords',
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
  {
    id: 'alarm_piano',
    title: 'Classical Solitude Piano',
    category: 'Soft Piano',
    durationSec: 6,
    icon: '🎹',
    description: 'Rich resonant piano chords creating an inspiring morning ambiance',
  },

  // --- 5. Vintage Clock ---
  {
    id: 'alarm_vintage_grandfather_clock',
    title: 'Grandfather Clock Westminster',
    category: 'Vintage Clock',
    durationSec: 8,
    icon: '🕰️',
    description: 'Authentic Westminster chime striking deep resonant acoustic bells',
  },
  {
    id: 'alarm_antique_pendulum_clock',
    title: 'Antique Pendulum Clock',
    category: 'Vintage Clock',
    durationSec: 8,
    icon: '⏳',
    description: 'Vintage brass mechanical clock with rhythmic pendulum and brass gong',
  },
  {
    id: 'alarm_classic_clock',
    title: 'Classic Twin Bell Ring',
    category: 'Vintage Clock',
    durationSec: 5,
    icon: '⏰',
    description: 'Real mechanical vintage twin brass bells striking rhythmically',
  },

  // --- 6. Meditation & Relaxing ---
  {
    id: 'alarm_tibetan_singing_bowl',
    title: 'Tibetan Singing Bowl',
    category: 'Meditation & Relaxing',
    durationSec: 8,
    icon: '🧘',
    description: 'Pure singing bowl harmonic overtone tuned to mindfulness frequency',
  },
  {
    id: 'alarm_temple_bell_chime',
    title: 'Zen Temple Bell Chime',
    category: 'Meditation & Relaxing',
    durationSec: 6,
    icon: '🎐',
    description: 'Spiritual bronze temple bell strike with serene decay and deep resonance',
  },

  // --- 7. Energetic Wake Up ---
  {
    id: 'alarm_marimba_sunshine',
    title: 'Sunny Morning Marimba',
    category: 'Energetic Wake Up',
    durationSec: 6,
    icon: '🪵',
    description: 'Uplifting African rosewood marimba pattern bursting with morning energy',
  },
  {
    id: 'alarm_electronic_pulse',
    title: 'Electronic Beat Alarm',
    category: 'Energetic Wake Up',
    durationSec: 6,
    icon: '⚡',
    description: 'Pumping four-on-the-floor synth bass pattern to energize your morning',
  },
  {
    id: 'alarm_synth_alert',
    title: 'Synth Wave Horizon',
    category: 'Energetic Wake Up',
    durationSec: 5,
    icon: '🎧',
    description: 'Retro 80s analog synthesizer lead with bright filtered saw waves',
  },
  {
    id: 'alarm_techno_riser',
    title: 'Cyber Riser Alert',
    category: 'Energetic Wake Up',
    durationSec: 5,
    icon: '🤖',
    description: 'High energy electronic festival buildup riser that snaps you awake',
  },

  // --- 8. Nature & Birds ---
  {
    id: 'alarm_spring_birds_chirp',
    title: 'Spring Meadow Birds',
    category: 'Nature & Birds',
    durationSec: 15,
    icon: '🐦',
    description: 'Lively morning chorus of singing robins, thrushes, and finches',
  },
  {
    id: 'alarm_morning_birds',
    title: 'Singing Garden Birds',
    category: 'Nature & Birds',
    durationSec: 6,
    icon: '🐤',
    description: 'Clear cheerful songbird melody recorded at first morning light',
  },
  {
    id: 'alarm_birds',
    title: 'Woodland Songbirds',
    category: 'Nature & Birds',
    durationSec: 6,
    icon: '🌲',
    description: 'Peaceful dawn chorus echoing through a sunny forest canopy',
  },

  // --- 9. Forest & Wildlife ---
  {
    id: 'alarm_forest_dawn',
    title: 'Forest Dawn Chorus',
    category: 'Forest & Wildlife',
    durationSec: 6,
    icon: '🌲',
    description: 'Crisp mountain forest ambient birds and soft rustling pine trees',
  },
  {
    id: 'alarm_rooster_crow',
    title: 'Rooster Morning Crow',
    category: 'Forest & Wildlife',
    durationSec: 5,
    icon: '🐓',
    description: 'Authentic countryside rooster crowing herald of the new day',
  },
  {
    id: 'alarm_rooster',
    title: 'Farmyard Rooster Call',
    category: 'Forest & Wildlife',
    durationSec: 5,
    icon: '🐔',
    description: 'Classic loud morning rooster wake-up call',
  },

  // --- 10. Ocean & Waterfall ---
  {
    id: 'alarm_mountain_waterfall',
    title: 'Mountain Waterfall Surge',
    category: 'Ocean & Waterfall',
    durationSec: 8,
    icon: '🌊',
    description: 'Powerful natural mountain cascade water flow with crystal-clear splash',
  },

  // --- 11. Rain & Thunder ---
  {
    id: 'alarm_distant_thunder_roll',
    title: 'Distant Thunder Roll',
    category: 'Rain & Thunder',
    durationSec: 8,
    icon: '⛈️',
    description: 'Deep low-frequency atmospheric thunder roll and distant summer rain',
  },

  // --- 12. Digital Alarm ---
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
  {
    id: 'alarm_digital',
    title: 'Digital Watch Beep',
    category: 'Digital Alarm',
    durationSec: 4,
    icon: '⌚',
    description: 'Classic digital wristwatch alarm pulse pattern',
  },

  // --- 13. Classic Bell ---
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
  {
    id: 'alarm_bell',
    title: 'School Brass Bell',
    category: 'Classic Bell',
    durationSec: 5,
    icon: '🔔',
    description: 'Traditional solid brass hand bell with penetrating tone',
  },
  {
    id: 'alarm_classic',
    title: 'Traditional Alarm Ring',
    category: 'Classic Bell',
    durationSec: 5,
    icon: '⏰',
    description: 'Crisp mechanical hammer striking twin brass alarm bells',
  },

  // --- 14. Cinematic ---
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
    title: 'Space Station Airlock',
    category: 'Cinematic',
    durationSec: 5,
    icon: '🚀',
    description: 'Deep space sci-fi airlock pressurization and resonant alert tone',
  },

  // --- 15. Ambient & Space ---
  {
    id: 'alarm_analog_synth_rise',
    title: 'Cosmic Synth Orbit',
    category: 'Ambient & Space',
    durationSec: 7,
    icon: '🌌',
    description: 'Warm analog synthesizer arpeggio drifting upward into deep space',
  },

  // --- 16. Loud & Urgent ---
  {
    id: 'alarm_facility_alert',
    title: 'Industrial Facility Siren',
    category: 'Loud & Urgent',
    durationSec: 6,
    icon: '🚨',
    description: 'Heavy duty factory emergency siren designed to cut through deep sleep',
  },
  {
    id: 'alarm_police_siren',
    title: 'Emergency Warning Siren',
    category: 'Loud & Urgent',
    durationSec: 7,
    icon: '🚒',
    description: 'Dual-tone urgent emergency siren sweep for heavy sleepers',
  },
  {
    id: 'alarm_fire_bell',
    title: 'Loud Fire Alarm Horn',
    category: 'Loud & Urgent',
    durationSec: 5,
    icon: '🔥',
    description: 'High-decibel building evacuation warning horn',
  },
  {
    id: 'alarm_extreme_danger',
    title: 'Heavy Duty Klaxon',
    category: 'Loud & Urgent',
    durationSec: 5,
    icon: '⚡',
    description: 'Naval vessel general quarters alert klaxon horn',
  },
  {
    id: 'alarm_siren',
    title: 'Rapid Alert Siren',
    category: 'Loud & Urgent',
    durationSec: 6,
    icon: '🚨',
    description: 'High-pitch continuous warning siren for guaranteed wakeup',
  },
  {
    id: 'alarm_emergency',
    title: 'Emergency Alarm Tone',
    category: 'Loud & Urgent',
    durationSec: 5,
    icon: '⚠️',
    description: 'Loud pulsed safety alarm tone to break sleep inertia',
  },

  // Legacy mix entries for backwards compatibility
  { id: 'alarm_mix_classic', title: 'Mix Classic Alarm', category: 'Classic Bell', durationSec: 5, icon: '🔔', description: 'Mixkit License classic alarm' },
  { id: 'alarm_mix_digital', title: 'Mix Digital Buzzer', category: 'Digital Alarm', durationSec: 8, icon: '📟', description: 'Mixkit License digital clock buzzer' },
  { id: 'alarm_mix_morning', title: 'Mix Morning Clock', category: 'Gentle Morning', durationSec: 9, icon: '⏰', description: 'Mixkit License morning clock alarm' },
  { id: 'alarm_mix_beep', title: 'Mix Clock Beep', category: 'Digital Alarm', durationSec: 8, icon: '🔔', description: 'Mixkit License alarm clock beep' },
  { id: 'alarm_mix_siren', title: 'Mix City Siren', category: 'Loud & Urgent', durationSec: 20, icon: '🚨', description: 'Mixkit License city alert siren' },
  { id: 'alarm_mix_tone', title: 'Mix Alarm Tone', category: 'Classic Bell', durationSec: 2, icon: '📢', description: 'Mixkit License short alarm tone' },
  { id: 'alarm_mix_short', title: 'Mix Short Alarm', category: 'Classic Bell', durationSec: 2, icon: '⏱️', description: 'Mixkit License classic short alarm' },
  { id: 'alarm_mix_space', title: 'Mix Space Alarm', category: 'Ambient & Space', durationSec: 7, icon: '🚀', description: 'Mixkit License space alarm' },
  { id: 'alarm_mix_facility', title: 'Mix Facility Alarm', category: 'Loud & Urgent', durationSec: 4, icon: '🏭', description: 'Mixkit License facility alarm' },
  { id: 'alarm_mix_rooster', title: 'Mix Rooster', category: 'Forest & Wildlife', durationSec: 6, icon: '🐓', description: 'Mixkit License morning rooster' },
];

export function findAlarmSoundItem(id: string | undefined): AlarmSoundItem | undefined {
  if (!id) return undefined;
  return ALARM_SOUND_ITEMS.find(item => item.id === id);
}

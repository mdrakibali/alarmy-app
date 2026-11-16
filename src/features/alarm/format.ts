import type { Alarm, MissionType } from './types';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MISSION_LABEL: Record<MissionType, string> = {
  math: 'Math',
  memory: 'Memory',
  typing: 'Typing',
  shake: 'Shake',
  squat: 'Squat',
  qr: 'QR',
  photo: 'Photo',
  step: 'Steps',
  flip: 'Flip Phone',
  blink: 'Blink / Smile',
};

export interface MissionInfo {
  title: string;
  desc: string;
  icon: string;
  badge: string;
  category: 'Cognitive' | 'Physical' | 'Out of Bed' | 'AI & Vision';
  difficulty: number;
  howItWorks: string;
  whyItWorks: string;
  recommendedFor: string;
}

export const MISSION_DETAILS: Record<MissionType, MissionInfo> = {
  math: {
    title: 'Math Mission',
    desc: 'Solve arithmetic equations to stimulate executive function and mental clarity.',
    icon: '🧠',
    badge: 'POPULAR',
    category: 'Cognitive',
    difficulty: 3,
    howItWorks: 'Solve 1 to 10 randomly generated arithmetic problems (+, −, ×). Wrong answers generate a fresh problem.',
    whyItWorks: 'Forces the prefrontal cortex out of sleep inertia through active numerical calculation.',
    recommendedFor: 'Heavy sleepers with intense morning brain fog.',
  },
  shake: {
    title: 'Shake Mission',
    desc: 'Vigorously shake your phone 20–50 times to get adrenaline pumping.',
    icon: '📱',
    badge: 'ACTIVE',
    category: 'Physical',
    difficulty: 2,
    howItWorks: 'Hold phone firmly and shake with rhythmic arm motion. Real-time accelerometer tracks shakes.',
    whyItWorks: 'Rapid physical movement elevates heart rate and releases wakefulness hormones immediately.',
    recommendedFor: 'Anyone who snoozes unconsciously with their eyes closed.',
  },
  step: {
    title: 'Step Mission',
    desc: 'Walk 10–50 steps to physically get out of your bed and onto your feet.',
    icon: '🚶',
    badge: 'MUST-HAVE',
    category: 'Out of Bed',
    difficulty: 3,
    howItWorks: 'Step out of bed and walk. Accelerometer & step sensors count your natural paces in real time.',
    whyItWorks: 'Walking 30 steps forces you out of your bedroom, breaking the physical comfort of your blanket.',
    recommendedFor: 'People who fall right back asleep after turning off normal alarms.',
  },
  squat: {
    title: 'Squat Mission',
    desc: 'Perform 5–20 morning squats holding your phone for blood circulation.',
    icon: '🏋️',
    badge: 'FITNESS',
    category: 'Physical',
    difficulty: 4,
    howItWorks: 'Stand upright, hold phone to chest, and perform deep squats. Accelerometer verifies vertical movement.',
    whyItWorks: 'Activates large quad and glute muscles, pumping oxygenated blood directly to the brain.',
    recommendedFor: 'Fitness enthusiasts and individuals seeking an instant burst of morning energy.',
  },
  photo: {
    title: 'Photo Mission',
    desc: 'Take a matching photograph of a registered object away from bed (e.g. bathroom sink).',
    icon: '📸',
    badge: 'HARD',
    category: 'Out of Bed',
    difficulty: 5,
    howItWorks: 'Register a photo once (e.g. bathroom tap). In the morning, walk over and snap the exact same scene.',
    whyItWorks: 'Impossible to cheat from bed. Requires standing up, turning on lights, and walking to another room.',
    recommendedFor: 'Extreme deep sleepers who need a 100% foolproof wake-up method.',
  },
  qr: {
    title: 'QR / Barcode',
    desc: 'Scan a physical barcode or QR code on an object far from bed (toothpaste, book).',
    icon: '📷',
    badge: 'UNBEATABLE',
    category: 'Out of Bed',
    difficulty: 5,
    howItWorks: 'Register any barcode (e.g. toothpaste tube). Scan that barcode in the morning to stop ringing.',
    whyItWorks: 'Forces you to physically reach the bathroom or kitchen sink with eyes open and lights on.',
    recommendedFor: 'Chronic snoozers who need a guaranteed trip to the bathroom sink.',
  },
  memory: {
    title: 'Memory Game',
    desc: 'Flip cards and find pairs to stimulate short-term memory and focus.',
    icon: '🧩',
    badge: 'BRAIN',
    category: 'Cognitive',
    difficulty: 3,
    howItWorks: 'Grid of cards is displayed face down. Flip 2 at a time to find all matching symbols.',
    whyItWorks: 'Engages working memory and visual pattern recognition, banishing morning drowsiness.',
    recommendedFor: 'People who wake up groggy and need a gentle cognitive challenge.',
  },
  typing: {
    title: 'Typing Mission',
    desc: 'Type uplifting motivational morning affirmations accurately.',
    icon: '⌨️',
    badge: 'EASY',
    category: 'Cognitive',
    difficulty: 2,
    howItWorks: 'Type an inspiring morning quote with zero typos. Mistakes require backspacing to correct.',
    whyItWorks: 'Combines fine motor coordination with positive mindset priming for the day ahead.',
    recommendedFor: 'Morning mindfulness practitioners and self-improvement focused risers.',
  },
  flip: {
    title: 'Flip Phone',
    desc: 'Flip phone face-down and face-up repeatedly to break sleep inertia.',
    icon: '🔄',
    badge: 'ICONIC',
    category: 'Physical',
    difficulty: 2,
    howItWorks: 'Turn your phone upside-down on a flat surface and flip back up 3 to 15 times.',
    whyItWorks: 'Simple tactile motor task requiring hand-eye coordination without excessive strain.',
    recommendedFor: 'Users looking for a quick, intuitive tactile mission that is faster than math.',
  },
  blink: {
    title: 'Blink Eyes',
    desc: 'Face the front camera and blink repeatedly to alert your optical nerves.',
    icon: '👁️',
    badge: 'AI VISION',
    category: 'AI & Vision',
    difficulty: 3,
    howItWorks: 'Look directly into front selfie camera. Optical AI tracks eye closure and counts verified blinks.',
    whyItWorks: 'Direct light exposure to retina and intentional blinking triggers optical wake pathways.',
    recommendedFor: 'Anyone whose primary struggle is opening their eyes in the dark.',
  },
};

export const SOUND_OPTIONS = [
  // Gentle Morning
  { id: 'alarm_gentle_morning', label: 'Gentle Morning Glockenspiel', icon: '☀️' },
  { id: 'alarm_golden_harp_arpeggio', label: 'Golden Harp Dawn Arpeggio', icon: '✨' },
  { id: 'alarm_morning_carillon_chime', label: 'Morning Carillon Chime', icon: '🔔' },
  { id: 'alarm_soft_wake', label: 'Soft Ambient Wake', icon: '🌸' },
  { id: 'alarm_morning_breeze', label: 'Morning Breeze Flute', icon: '🍃' },

  // Acoustic Guitar
  { id: 'alarm_acoustic_guitar_strum', label: 'Acoustic Guitar Strum', icon: '🎸' },
  { id: 'alarm_acoustic_guitar_morning', label: 'Warm Morning Fingerpicking', icon: '🎶' },

  // Flute & Instrumental
  { id: 'alarm_zen_bamboo_flute', label: 'Zen Bamboo Flute', icon: '🎋' },
  { id: 'alarm_celtic_tin_whistle', label: 'Celtic Dawn Whistle', icon: '☘️' },

  // Soft Piano
  { id: 'alarm_piano_medley', label: 'Acoustic Grand Piano Chords', icon: '🎹' },
  { id: 'alarm_peaceful_keys', label: 'Peaceful Sunrise Keys', icon: '🎼' },
  { id: 'alarm_mellow_harmony', label: 'Mellow Piano Echo', icon: '✨' },
  { id: 'alarm_piano', label: 'Classical Solitude Piano', icon: '🎹' },

  // Vintage Clock
  { id: 'alarm_vintage_grandfather_clock', label: 'Grandfather Clock Westminster', icon: '🕰️' },
  { id: 'alarm_antique_pendulum_clock', label: 'Antique Pendulum Clock', icon: '⏳' },
  { id: 'alarm_classic_clock', label: 'Classic Twin Bell Ring', icon: '🔔' },

  // Meditation & Relaxing
  { id: 'alarm_tibetan_singing_bowl', label: 'Tibetan Singing Bowl', icon: '🧘' },
  { id: 'alarm_temple_bell_chime', label: 'Zen Temple Bell Chime', icon: '🎐' },

  // Energetic Wake Up
  { id: 'alarm_marimba_sunshine', label: 'Sunny Morning Marimba', icon: '🪵' },
  { id: 'alarm_electronic_pulse', label: 'Electronic Beat Alarm', icon: '⚡' },
  { id: 'alarm_synth_alert', label: 'Synth Wave Horizon', icon: '🎧' },
  { id: 'alarm_techno_riser', label: 'Cyber Riser Siren', icon: '🤖' },

  // Nature & Birds
  { id: 'alarm_spring_birds_chirp', label: 'Spring Meadow Birds', icon: '🐦' },
  { id: 'alarm_morning_birds', label: 'Singing Garden Birds', icon: '🐤' },
  { id: 'alarm_birds', label: 'Woodland Songbirds', icon: '🌲' },

  // Forest & Wildlife
  { id: 'alarm_forest_dawn', label: 'Forest Dawn Chorus', icon: '🌲' },
  { id: 'alarm_rooster_crow', label: 'Rooster Morning Crow', icon: '🐓' },
  { id: 'alarm_rooster', label: 'Farmyard Rooster Call', icon: '🐔' },

  // Ocean & Waterfall
  { id: 'alarm_mountain_waterfall', label: 'Mountain Waterfall Surge', icon: '🌊' },

  // Rain & Thunder
  { id: 'alarm_distant_thunder_roll', label: 'Distant Thunder Roll', icon: '⛈️' },

  // Digital Alarm
  { id: 'alarm_digital_buzzer', label: 'Digital Clock Buzzer', icon: '⏰' },
  { id: 'alarm_digital_beeps', label: 'Fast Digital Beeps', icon: '📟' },
  { id: 'alarm_arcade_bleep', label: 'Retro 8-Bit Wakeup', icon: '🕹️' },
  { id: 'alarm_radar_ping', label: 'Futuristic Radar Ping', icon: '📡' },
  { id: 'alarm_digital', label: 'Digital Watch Beep', icon: '⌚' },

  // Classic Bell
  { id: 'alarm_service_bell', label: 'Brass Desk Bell', icon: '🛎️' },
  { id: 'alarm_ship_bell', label: 'Nautical Bell Strike', icon: '⚓' },
  { id: 'alarm_bell', label: 'School Brass Bell', icon: '🔔' },
  { id: 'alarm_classic', label: 'Traditional Alarm Ring', icon: '⏰' },

  // Cinematic
  { id: 'alarm_cinematic_horn', label: 'Cinematic Horn Rise', icon: '🎺' },
  { id: 'alarm_epic_countdown', label: 'Epic Countdown Alert', icon: '🎬' },
  { id: 'alarm_space_transit', label: 'Space Station Airlock', icon: '🚀' },

  // Ambient & Space
  { id: 'alarm_analog_synth_rise', label: 'Cosmic Synth Orbit', icon: '🌌' },

  // Loud & Urgent
  { id: 'alarm_facility_alert', label: 'Industrial Facility Siren', icon: '🚨' },
  { id: 'alarm_police_siren', label: 'Emergency Warning Siren', icon: '🚒' },
  { id: 'alarm_fire_bell', label: 'Loud Fire Alarm Horn', icon: '🔥' },
  { id: 'alarm_extreme_danger', label: 'Heavy Duty Klaxon', icon: '⚡' },
  { id: 'alarm_siren', label: 'Rapid Alert Siren', icon: '🚨' },
  { id: 'alarm_emergency', label: 'Emergency Alarm Tone', icon: '⚠️' },

  // Mix entries for backwards compatibility
  { id: 'alarm_mix_classic', label: 'Mix Classic Alarm', icon: '🔔' },
  { id: 'alarm_mix_digital', label: 'Mix Digital Buzzer', icon: '📟' },
  { id: 'alarm_mix_morning', label: 'Mix Morning Clock', icon: '⏰' },
  { id: 'alarm_mix_beep', label: 'Mix Clock Beep', icon: '🔔' },
  { id: 'alarm_mix_siren', label: 'Mix City Siren', icon: '🚨' },
  { id: 'alarm_mix_tone', label: 'Mix Alarm Tone', icon: '📢' },
  { id: 'alarm_mix_short', label: 'Mix Short Alarm', icon: '⏱️' },
  { id: 'alarm_mix_space', label: 'Mix Space Alarm', icon: '🚀' },
  { id: 'alarm_mix_facility', label: 'Mix Facility Alarm', icon: '🏭' },
  { id: 'alarm_mix_rooster', label: 'Mix Rooster', icon: '🐓' },
  { id: 'alarm_gentle', label: 'Gentle Morning', icon: '🍃' },
  { id: 'alarm_electronic', label: 'Electronic Beat', icon: '🎵' },
  { id: 'cats', label: 'Dancing Cat (Video Sound)', icon: '🐱' },
  { id: 'illit', label: "[ILLIT] You're Under Arrest", icon: '✨' },
] as const;

export const SNOOZE_INTERVALS = [3, 5, 10, 15, 30];
export const SNOOZE_COUNTS = [1, 2, 3, 5];

export function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = minute.toString().padStart(2, '0');
  return { time: `${h}:${m}`, period };
}

export function formatAlbaDate(date: Date = new Date()): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${months[date.getMonth()]} ${date.getDate()} ${days[date.getDay()]}`;
}
export const formatAlarmyDate = formatAlbaDate;

export function formatAlbaClock(date: Date = new Date()): string {
  const h = date.getHours() % 12 || 12;
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
export const formatAlarmyClock = formatAlbaClock;

export function formatRepeat(days: number[]) {
  if (days.length === 0) {
    return 'Once';
  }
  const sorted = [...days].sort((a, b) => a - b);
  if (sorted.length === 7) {
    return 'Every day';
  }
  if (sorted.join() === '1,2,3,4,5') {
    return 'Weekdays';
  }
  if (sorted.join() === '0,6') {
    return 'Weekends';
  }
  return sorted.map(d => DAY_SHORT[d]).join(', ');
}

export function sortAlarms(alarms: Alarm[]) {
  return [...alarms].sort(
    (a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute),
  );
}

export function blankAlarm(): Omit<Alarm, 'id'> {
  return {
    hour: 7,
    minute: 0,
    label: 'Wake up early',
    repeatDays: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    soundId: 'alarm_rooster',
    volume: 1,
    vibrate: true,
    snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
    missions: ['shake'],
    wallpaper: 'nature_mountain_view',
  };
}

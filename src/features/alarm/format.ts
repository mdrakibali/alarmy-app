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
};

export const MISSION_DETAILS: Record<
  MissionType,
  { title: string; desc: string; icon: string; badge: string }
> = {
  math: {
    title: 'Math Mission',
    desc: 'Solve simple to complex math problems to wake your brain up',
    icon: '🧠',
    badge: 'POPULAR',
  },
  shake: {
    title: 'Shake Mission',
    desc: 'Shake your phone up to 50 times to get your blood flowing',
    icon: '📱',
    badge: 'ACTIVE',
  },
  qr: {
    title: 'QR / Barcode',
    desc: 'Leave bed and scan a barcode (e.g. toothpaste in bathroom)',
    icon: '📷',
    badge: 'UNBEATABLE',
  },
  memory: {
    title: 'Memory Game',
    desc: 'Flip and match card pairs to build morning focus',
    icon: '🧩',
    badge: 'BRAIN',
  },
  typing: {
    title: 'Typing Mission',
    desc: 'Type motivational affirmations accurately',
    icon: '⌨️',
    badge: 'EASY',
  },
  photo: {
    title: 'Photo Mission',
    desc: 'Take a photo of a registered place or object in your room',
    icon: '📸',
    badge: 'HARD',
  },
  squat: {
    title: 'Squat Mission',
    desc: 'Perform 10 morning squats to wake up your body',
    icon: '🏋️',
    badge: 'FITNESS',
  },
  step: {
    title: 'Step Mission',
    desc: 'Walk 30 steps away from bed',
    icon: '🚶',
    badge: 'ACTIVE',
  },
};

export const SOUND_OPTIONS = [
  { id: 'alarm_gentle_morning', label: 'Gentle Morning Chime', icon: '☀️' },
  { id: 'alarm_cinematic_horn', label: 'Cinematic Horn Rise', icon: '🎺' },
  { id: 'alarm_epic_countdown', label: 'Epic Countdown Alert', icon: '🎬' },
  { id: 'alarm_space_transit', label: 'Space Station Alert', icon: '🚀' },
  { id: 'alarm_soft_wake', label: 'Soft Ambient Wake', icon: '🌸' },
  { id: 'alarm_morning_breeze', label: 'Morning Breeze Melody', icon: '🍃' },
  { id: 'alarm_piano_medley', label: 'Acoustic Piano Chords', icon: '🎹' },
  { id: 'alarm_peaceful_keys', label: 'Peaceful Sunrise Keys', icon: '🎼' },
  { id: 'alarm_mellow_harmony', label: 'Mellow Piano Echo', icon: '✨' },
  { id: 'alarm_digital_buzzer', label: 'Digital Clock Buzzer', icon: '⏰' },
  { id: 'alarm_digital_beeps', label: 'Fast Digital Beeps', icon: '📟' },
  { id: 'alarm_arcade_bleep', label: 'Retro 8-Bit Wakeup', icon: '🕹️' },
  { id: 'alarm_radar_ping', label: 'Futuristic Radar Ping', icon: '📡' },
  { id: 'alarm_electronic_pulse', label: 'Electronic Beat Alarm', icon: '⚡' },
  { id: 'alarm_synth_alert', label: 'Synth Wave Alarm', icon: '🎧' },
  { id: 'alarm_techno_riser', label: 'Cyber Riser Siren', icon: '🤖' },
  { id: 'alarm_rooster_crow', label: 'Rooster Morning Crow', icon: '🐓' },
  { id: 'alarm_morning_birds', label: 'Singing Garden Birds', icon: '🐦' },
  { id: 'alarm_forest_dawn', label: 'Forest Dawn Chorus', icon: '🌲' },
  { id: 'alarm_facility_alert', label: 'Industrial Facility Siren', icon: '🚨' },
  { id: 'alarm_police_siren', label: 'Emergency Warning Siren', icon: '🚒' },
  { id: 'alarm_fire_bell', label: 'Loud Fire Alarm Horn', icon: '🔥' },
  { id: 'alarm_extreme_danger', label: 'Heavy Duty Klaxon', icon: '⚡' },
  { id: 'alarm_classic_clock', label: 'Classic Twin Bell Ring', icon: '🔔' },
  { id: 'alarm_service_bell', label: 'Brass Desk Bell', icon: '🛎️' },
  { id: 'alarm_ship_bell', label: 'Nautical Bell Strike', icon: '⚓' },
  { id: 'alarm_classic', label: 'Classic Alarm', icon: '⏰' },
  { id: 'alarm_digital', label: 'Digital Watch', icon: '⌚' },
  { id: 'alarm_rooster', label: 'Rooster Crow', icon: '🐓' },
  { id: 'alarm_birds', label: 'Forest Birds', icon: '🐦' },
  { id: 'alarm_gentle', label: 'Gentle Morning', icon: '🍃' },
  { id: 'alarm_piano', label: 'Warm Piano', icon: '🎹' },
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
    repeatDays: [1, 2, 3, 4, 5],
    enabled: true,
    soundId: 'alarm_rooster',
    volume: 1,
    vibrate: true,
    snooze: { enabled: true, intervalMin: 5, maxCount: 3 },
    missions: ['shake'],
  };
}

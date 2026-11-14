export type OfflineKind = 'video' | 'audio';

export interface OfflinePackItem {
  id: string;
  title: string;
  kind: OfflineKind;
  fileName: string;
  url: string;
}

/** Optional Mixkit files. They are not in the APK until the phone downloads them. */
export const OFFLINE_PACK: OfflinePackItem[] = [
  { id: 'dl_sunset_city', title: 'Sunset city video', kind: 'video', fileName: 'dl-sunset-city.mp4', url: 'https://assets.mixkit.co/videos/3983/3983-720.mp4' },
  { id: 'dl_sun_meadow', title: 'Sunlit meadow video', kind: 'video', fileName: 'dl-sun-meadow.mp4', url: 'https://assets.mixkit.co/videos/40657/40657-720.mp4' },
  { id: 'dl_slow_river', title: 'Slow river video', kind: 'video', fileName: 'dl-slow-river.mp4', url: 'https://assets.mixkit.co/videos/1218/1218-720.mp4' },
  { id: 'dl_alps', title: 'Alpine clouds video', kind: 'video', fileName: 'dl-alps.mp4', url: 'https://assets.mixkit.co/videos/4132/4132-720.mp4' },
  { id: 'dl_countryside', title: 'Countryside video', kind: 'video', fileName: 'dl-countryside.mp4', url: 'https://assets.mixkit.co/videos/4075/4075-720.mp4' },
  { id: 'dl_park', title: 'Park morning video', kind: 'video', fileName: 'dl-park.mp4', url: 'https://assets.mixkit.co/videos/4831/4831-720.mp4' },
  { id: 'dl_train', title: 'City train video', kind: 'video', fileName: 'dl-train.mp4', url: 'https://assets.mixkit.co/videos/1606/1606-720.mp4' },
  { id: 'dl_ink', title: 'Ink flow video', kind: 'video', fileName: 'dl-ink.mp4', url: 'https://assets.mixkit.co/videos/44818/44818-720.mp4' },
  { id: 'dl_alert', title: 'Alert alarm', kind: 'audio', fileName: 'dl-alert-alarm.wav', url: 'https://assets.mixkit.co/active_storage/sfx/1005/1005.wav' },
  { id: 'dl_retro', title: 'Retro game alarm', kind: 'audio', fileName: 'dl-retro-alarm.wav', url: 'https://assets.mixkit.co/active_storage/sfx/1000/1000.wav' },
  { id: 'dl_emergency', title: 'Emergency alert', kind: 'audio', fileName: 'dl-emergency-alert.wav', url: 'https://assets.mixkit.co/active_storage/sfx/1007/1007.wav' },
  { id: 'dl_wave', title: 'Wave alarm', kind: 'audio', fileName: 'dl-wave-alarm.wav', url: 'https://assets.mixkit.co/active_storage/sfx/987/987.wav' },
];

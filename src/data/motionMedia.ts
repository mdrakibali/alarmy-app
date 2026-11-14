export type MotionKind = 'gif' | 'video';

export interface MotionItem {
  id: string;
  name: string;
  kind: MotionKind;
  poster: number;
  /** Path inside android assets, not a JS bundle require. */
  asset: string;
  creditId: string;
}

export const MOTION_MEDIA: MotionItem[] = [
  { id: 'motion_gif_sunset_city', name: 'Sunset city', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-sunset-city.jpg'), asset: 'alba/gif/gif-sunset-city.gif', creditId: 'mixkit-3983' },
  { id: 'motion_gif_sun_meadow', name: 'Sunlit meadow', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-sun-meadow.jpg'), asset: 'alba/gif/gif-sun-meadow.gif', creditId: 'mixkit-40657' },
  { id: 'motion_gif_slow_river', name: 'Slow river', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-slow-river.jpg'), asset: 'alba/gif/gif-slow-river.gif', creditId: 'mixkit-1218' },
  { id: 'motion_gif_stone_water', name: 'Water on stones', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-stone-water.jpg'), asset: 'alba/gif/gif-stone-water.gif', creditId: 'mixkit-2186' },
  { id: 'motion_gif_alps', name: 'Alpine clouds', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-alps.jpg'), asset: 'alba/gif/gif-alps.gif', creditId: 'mixkit-4132' },
  { id: 'motion_gif_dusk_city', name: 'City at dusk', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-dusk-city.jpg'), asset: 'alba/gif/gif-dusk-city.gif', creditId: 'mixkit-41375' },
  { id: 'motion_gif_countryside', name: 'Countryside', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-countryside.jpg'), asset: 'alba/gif/gif-countryside.gif', creditId: 'mixkit-4075' },
  { id: 'motion_gif_park_run', name: 'Park morning', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-park-run.jpg'), asset: 'alba/gif/gif-park-run.gif', creditId: 'mixkit-4831' },
  { id: 'motion_gif_city_train', name: 'City train', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-city-train.jpg'), asset: 'alba/gif/gif-city-train.gif', creditId: 'mixkit-1606' },
  { id: 'motion_gif_city_side', name: 'Night city', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-city-side.jpg'), asset: 'alba/gif/gif-city-side.gif', creditId: 'mixkit-49846' },
  { id: 'motion_gif_lava', name: 'Lava sparks', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-lava.jpg'), asset: 'alba/gif/gif-lava.gif', creditId: 'mixkit-4426' },
  { id: 'motion_gif_flames', name: 'Flames', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-flames.jpg'), asset: 'alba/gif/gif-flames.gif', creditId: 'mixkit-52304' },
  { id: 'motion_gif_ink', name: 'Ink flow', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-ink-flow.jpg'), asset: 'alba/gif/gif-ink-flow.gif', creditId: 'mixkit-44818' },
  { id: 'motion_gif_sunset_beach', name: 'Sunset beach', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-sunset-beach.jpg'), asset: 'alba/gif/gif-sunset-beach.gif', creditId: 'mixkit-2168' },
  { id: 'motion_gif_sunset_sea', name: 'Sunset sea', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-sunset-sea.jpg'), asset: 'alba/gif/gif-sunset-sea.gif', creditId: 'mixkit-4119' },
  { id: 'motion_gif_rain_lake', name: 'Rain on the lake', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-rain-lake.jpg'), asset: 'alba/gif/gif-rain-lake.gif', creditId: 'mixkit-18312' },
  { id: 'motion_gif_waterfall', name: 'Waterfall', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-waterfall.jpg'), asset: 'alba/gif/gif-waterfall.gif', creditId: 'mixkit-572' },
  { id: 'motion_gif_fireplace', name: 'Fireplace', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-fireplace.jpg'), asset: 'alba/gif/gif-fireplace.gif', creditId: 'mixkit-52284' },
  { id: 'motion_gif_space', name: 'Stars', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-space-stars.jpg'), asset: 'alba/gif/gif-space-stars.gif', creditId: 'mixkit-1610' },
  { id: 'motion_gif_moon', name: 'Hazy moon', kind: 'gif', poster: require('../assets/backgrounds/posters/gif-night-moon.jpg'), asset: 'alba/gif/gif-night-moon.gif', creditId: 'mixkit-4433' },
  { id: 'motion_vid_sunset_beach', name: 'Sunset beach', kind: 'video', poster: require('../assets/backgrounds/posters/vid-sunset-beach.jpg'), asset: 'alba/video/mixkit-sunset-beach.mp4', creditId: 'mixkit-2168' },
  { id: 'motion_vid_sunset_sea', name: 'Sunset sea', kind: 'video', poster: require('../assets/backgrounds/posters/vid-sunset-sea.jpg'), asset: 'alba/video/mixkit-sunset-sea.mp4', creditId: 'mixkit-4119' },
  { id: 'motion_vid_rain_lake', name: 'Rain on the lake', kind: 'video', poster: require('../assets/backgrounds/posters/vid-rain-lake.jpg'), asset: 'alba/video/mixkit-rain-lake.mp4', creditId: 'mixkit-18312' },
  { id: 'motion_vid_waterfall', name: 'Waterfall', kind: 'video', poster: require('../assets/backgrounds/posters/vid-waterfall.jpg'), asset: 'alba/video/mixkit-waterfall.mp4', creditId: 'mixkit-572' },
  { id: 'motion_vid_fireplace', name: 'Fireplace', kind: 'video', poster: require('../assets/backgrounds/posters/vid-fireplace.jpg'), asset: 'alba/video/mixkit-fireplace.mp4', creditId: 'mixkit-52284' },
  { id: 'motion_vid_space', name: 'Stars', kind: 'video', poster: require('../assets/backgrounds/posters/vid-space-stars.jpg'), asset: 'alba/video/mixkit-space-stars.mp4', creditId: 'mixkit-1610' },
  { id: 'motion_vid_city_night', name: 'City at night', kind: 'video', poster: require('../assets/backgrounds/posters/vid-city-night.jpg'), asset: 'alba/video/mixkit-city-night.mp4', creditId: 'mixkit-49845' },
  { id: 'motion_vid_moon', name: 'Hazy moon', kind: 'video', poster: require('../assets/backgrounds/posters/vid-night-moon.jpg'), asset: 'alba/video/mixkit-night-moon.mp4', creditId: 'mixkit-4433' },
  { id: 'motion_vid_forest_falls', name: 'Forest waterfall', kind: 'video', poster: require('../assets/backgrounds/posters/vid-forest-waterfall.jpg'), asset: 'alba/video/mixkit-forest-waterfall.mp4', creditId: 'mixkit-2213' },
  { id: 'motion_vid_clouds', name: 'Clouds over meadow', kind: 'video', poster: require('../assets/backgrounds/posters/vid-clouds-meadow.jpg'), asset: 'alba/video/mixkit-clouds-meadow.mp4', creditId: 'mixkit-4070' },
];

export function findMotionMedia(id: string | undefined) {
  if (!id) return undefined;
  return MOTION_MEDIA.find(item => item.id === id);
}

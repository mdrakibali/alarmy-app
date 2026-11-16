export type LottieCategory =
  | 'Sunrise'
  | 'Nature'
  | 'Weather'
  | 'Galaxy'
  | 'Particles'
  | 'Winter'
  | 'Abstract';

export interface LottieItem {
  id: string;
  name: string;
  category: LottieCategory;
  source: any;
  creditId: string;
}

export const LOTTIE_MEDIA: LottieItem[] = [
  {
    id: 'lottie_sunrise_cycle',
    name: 'Animated Sunrise & Day Cycle',
    category: 'Sunrise',
    source: require('../assets/animations/lottie/lottie_sunrise_cycle.json'),
    creditId: 'lottie-day-night-cycle-mit',
  },
  {
    id: 'lottie_thunder_rain',
    name: 'Thunderstorm & Falling Rain',
    category: 'Weather',
    source: require('../assets/animations/lottie/lottie_thunder_rain.json'),
    creditId: 'lottie-thunderstorm-mit',
  },
  {
    id: 'lottie_nature_breeze',
    name: 'Windy Breeze & Falling Leaves',
    category: 'Nature',
    source: require('../assets/animations/lottie/lottie_nature_breeze.json'),
    creditId: 'lottie-windy-mit',
  },
  {
    id: 'lottie_misty_clouds',
    name: 'Misty Moving Clouds',
    category: 'Weather',
    source: require('../assets/animations/lottie/lottie_misty_clouds.json'),
    creditId: 'lottie-fog-mit',
  },
  {
    id: 'lottie_flying_birds',
    name: 'Nature Birds in Flight',
    category: 'Nature',
    source: require('../assets/animations/lottie/lottie_flying_birds.json'),
    creditId: 'lottie-birds-mit',
  },
  {
    id: 'lottie_starry_galaxy',
    name: 'Cosmic Galaxy & Orbiting Stars',
    category: 'Galaxy',
    source: require('../assets/animations/lottie/lottie_starry_galaxy.json'),
    creditId: 'lottie-space-mit',
  },
  {
    id: 'lottie_firefly_particles',
    name: 'Glowing Fireflies & Light Particles',
    category: 'Particles',
    source: require('../assets/animations/lottie/lottie_firefly_particles.json'),
    creditId: 'lottie-light-mit',
  },
  {
    id: 'lottie_winter_snowfall',
    name: 'Winter Snowfall & Crystals',
    category: 'Winter',
    source: require('../assets/animations/lottie/lottie_winter_snowfall.json'),
    creditId: 'lottie-snowcation-mit',
  },
  {
    id: 'lottie_abstract_gradient',
    name: 'Calm Abstract Radiant Gradient',
    category: 'Abstract',
    source: require('../assets/animations/lottie/lottie_abstract_gradient.json'),
    creditId: 'lottie-gradient-mit',
  },
  {
    id: 'lottie_water_ripple',
    name: 'Ocean Waves & Ripple Droplets',
    category: 'Nature',
    source: require('../assets/animations/lottie/lottie_water_ripple.json'),
    creditId: 'lottie-drop-mit',
  },
];

export function findLottieMedia(id: string | undefined): LottieItem | undefined {
  if (!id) return undefined;
  return LOTTIE_MEDIA.find(item => item.id === id);
}

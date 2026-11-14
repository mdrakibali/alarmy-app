export type AlbaGroup = 'Nature' | 'Mountains' | 'Flowers' | 'Minimal' | 'Abstract' | 'Motivational' | 'Night';

export interface AlbaBackground {
  id: string;
  name: string;
  group: AlbaGroup;
  source: number;
  creditId: string;
}

export const ALBA_BACKGROUNDS: AlbaBackground[] = [
  {
    id: 'alba_forest_sunrise',
    name: 'Forest sunrise',
    group: 'Nature',
    source: require('../assets/backgrounds/nature/forest-sunrise.jpg'),
    creditId: 'pexels-3734875',
  },
  {
    id: 'alba_forest_stream',
    name: 'Forest stream',
    group: 'Nature',
    source: require('../assets/backgrounds/nature/forest-stream.jpg'),
    creditId: 'pexels-355321',
  },
  {
    id: 'alba_mountain_valley',
    name: 'Mountain valley',
    group: 'Nature',
    source: require('../assets/backgrounds/nature/mountain-valley.jpg'),
    creditId: 'pexels-1366919',
  },
  {
    id: 'alba_ocean_sunset',
    name: 'Ocean sunset',
    group: 'Nature',
    source: require('../assets/backgrounds/nature/golden-sunset.jpg'),
    creditId: 'pexels-1032650',
  },
  {
    id: 'alba_moon_peaks',
    name: 'Moon over peaks',
    group: 'Minimal',
    source: require('../assets/backgrounds/nature/moon-peaks.jpg'),
    creditId: 'pexels-1287145',
  },
  {
    id: 'alba_lavender',
    name: 'Lavender evening',
    group: 'Motivational',
    source: require('../assets/backgrounds/minimal/soft-field.jpg'),
    creditId: 'pexels-1166209',
  },
  {
    id: 'alba_lake_stars',
    name: 'Lake stars',
    group: 'Night',
    source: require('../assets/backgrounds/night/lake-stars.jpg'),
    creditId: 'pexels-1252869',
  },
  {
    id: 'alba_milky_way',
    name: 'Milky way',
    group: 'Night',
    source: require('../assets/backgrounds/night/starry-night.jpg'),
    creditId: 'pexels-355465',
  },
  {
    id: 'alba_storm_island',
    name: 'Storm island',
    group: 'Night',
    source: require('../assets/backgrounds/night/storm-island.jpg'),
    creditId: 'pexels-1118873',
  },
  {
    id: 'alba_coast',
    name: 'Forest coast',
    group: 'Nature',
    source: require('../assets/backgrounds/nature/waterfall.jpg'),
    creditId: 'pexels-931018',
  },
  {
    id: 'alba_ridge_lake',
    name: 'Ridge lake',
    group: 'Mountains',
    source: require('../assets/backgrounds/mountains/ridge.jpg'),
    creditId: 'pexels-417074',
  },
  {
    id: 'alba_fog_forest',
    name: 'Fog forest',
    group: 'Minimal',
    source: require('../assets/backgrounds/minimal/fog.jpg'),
    creditId: 'pexels-167699',
  },
  {
    id: 'alba_sunflower',
    name: 'Sunflower',
    group: 'Flowers',
    source: require('../assets/backgrounds/flowers/sunflower.jpg'),
    creditId: 'pexels-1366630',
  },
  {
    id: 'alba_pink_bloom',
    name: 'Pink bloom',
    group: 'Flowers',
    source: require('../assets/backgrounds/flowers/pink-bloom.jpg'),
    creditId: 'pexels-931177',
  },
  {
    id: 'alba_crystal_wood',
    name: 'Glass and wood',
    group: 'Abstract',
    source: require('../assets/backgrounds/abstract/sand.jpg'),
    creditId: 'pexels-235615',
  },
  {
    id: 'alba_moving_water',
    name: 'Moving water',
    group: 'Abstract',
    source: require('../assets/backgrounds/night/moon-sea.jpg'),
    creditId: 'pexels-355288',
  },
];

export function findAlbaBackground(id: string | undefined) {
  if (!id) return undefined;
  return ALBA_BACKGROUNDS.find(item => item.id === id);
}

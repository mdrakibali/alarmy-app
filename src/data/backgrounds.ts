export type BackgroundCategory =
  | 'All'
  | 'Trending'
  | 'KPOP'
  | 'Nature'
  | 'Sky'
  | 'Aesthetic'
  | 'Minimal';

export interface BackgroundItem {
  id: string;
  name: string;
  category: BackgroundCategory;
  source: any;
  overlayOpacity?: number; // suggested default
  brightness?: number;
  previewColor: string;
}

export const BACKGROUND_ITEMS: BackgroundItem[] = [
  {
    id: 'sunrise',
    name: 'Golden Sunrise',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_sunrise.png'),
    previewColor: '#FF9944',
  },
  {
    id: 'sunset',
    name: 'Violet Sunset',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_sunset.png'),
    previewColor: '#8E2D6E',
  },
  {
    id: 'night_sky',
    name: 'Starry Night',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_night_sky.png'),
    previewColor: '#191E50',
  },
  {
    id: 'galaxy',
    name: 'Cosmic Galaxy',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_galaxy.png'),
    previewColor: '#6B2D9E',
  },
  {
    id: 'ocean',
    name: 'Tropical Ocean',
    category: 'Nature',
    source: require('../assets/images/backgrounds/bg_ocean.png'),
    previewColor: '#00A8B5',
  },
  {
    id: 'mountains',
    name: 'Misty Mountains',
    category: 'Nature',
    source: require('../assets/images/backgrounds/bg_mountains.png'),
    previewColor: '#6E78A5',
  },
  {
    id: 'forest',
    name: 'Emerald Forest',
    category: 'Nature',
    source: require('../assets/images/backgrounds/bg_forest.png'),
    previewColor: '#286E4B',
  },
  {
    id: 'minimal',
    name: 'Soft Slate',
    category: 'Minimal',
    source: require('../assets/images/backgrounds/bg_minimal.png'),
    previewColor: '#E2E8F0',
  },
  {
    id: 'abstract',
    name: 'Abstract Glow',
    category: 'Aesthetic',
    source: require('../assets/images/backgrounds/bg_abstract.png'),
    previewColor: '#E11D48',
  },
  {
    id: 'gradient',
    name: 'Alarmy Coral',
    category: 'Aesthetic',
    source: require('../assets/images/backgrounds/bg_gradient.png'),
    previewColor: '#FF385C',
  },
  {
    id: 'kpop',
    name: 'K-Pop Pastel',
    category: 'KPOP',
    source: require('../assets/images/backgrounds/bg_kpop.png'),
    previewColor: '#D2BEF5',
  },
  {
    id: 'cats',
    name: 'Dancing Cat',
    category: 'Trending',
    source: require('../assets/images/backgrounds/bg_cats.png'),
    previewColor: '#F59E0B',
  },
];

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
  isAnimated?: boolean;
  overlayOpacity?: number;
  brightness?: number;
  previewColor: string;
}

export const BACKGROUND_ITEMS: BackgroundItem[] = [
  {
    id: 'cats',
    name: 'Dancing Cat (Animated GIF)',
    category: 'Trending',
    source: require('../assets/images/backgrounds/bg_cats.gif'),
    isAnimated: true,
    previewColor: '#F59E0B',
  },
  {
    id: 'galaxy',
    name: 'Cosmic Galaxy (Animated GIF)',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_galaxy.gif'),
    isAnimated: true,
    previewColor: '#6B2D9E',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves (Animated GIF)',
    category: 'Nature',
    source: require('../assets/images/backgrounds/bg_ocean.gif'),
    isAnimated: true,
    previewColor: '#00A8B5',
  },
  {
    id: 'sunrise',
    name: 'Golden Sunrise (Animated GIF)',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_sunrise.gif'),
    isAnimated: true,
    previewColor: '#FF9944',
  },
  {
    id: 'night_sky',
    name: 'Starry Night (Animated GIF)',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_night_sky.gif'),
    isAnimated: true,
    previewColor: '#191E50',
  },
  {
    id: 'kpop',
    name: 'K-Pop Stage (Animated GIF)',
    category: 'KPOP',
    source: require('../assets/images/backgrounds/bg_kpop.gif'),
    isAnimated: true,
    previewColor: '#D2BEF5',
  },
  {
    id: 'sunset',
    name: 'Violet Sunset',
    category: 'Sky',
    source: require('../assets/images/backgrounds/bg_sunset.png'),
    previewColor: '#8E2D6E',
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
];

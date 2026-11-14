import React from 'react';
import {
  Image,
  View,
} from 'react-native';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { WALLPAPERS } from '@/data/wallpapers';
import { BackgroundTarget, useThemeStore } from '@/storage/themeStore';

interface Props {
  target?: BackgroundTarget;
  backgroundId?: string;
  children: React.ReactNode;
  className?: string;
}

export function AppBackground({
  target = 'home',
  backgroundId: overrideId,
  children,
  className = '',
}: Props) {
  const homeBackground = useThemeStore(s => s.homeBackground);
  const alarmBackground = useThemeStore(s => s.alarmBackground);
  const ringingBackground = useThemeStore(s => s.ringingBackground);
  const sleepBackground = useThemeStore(s => s.sleepBackground);
  const missionBackground = useThemeStore(s => s.missionBackground);
  const brightness = useThemeStore(s => s.brightness);
  const overlayOpacity = useThemeStore(s => s.overlayOpacity);

  let activeId = overrideId;
  if (!activeId) {
    if (target === 'home') activeId = homeBackground;
    else if (target === 'alarm') activeId = alarmBackground;
    else if (target === 'ringing') activeId = ringingBackground;
    else if (target === 'sleep') activeId = sleepBackground;
    else if (target === 'mission') activeId = missionBackground;
  }

  const wallpaperItem = WALLPAPERS.find(w => w.id === activeId);
  const bgItem = BACKGROUND_ITEMS.find(b => b.id === activeId);

  const isCustomUri =
    activeId?.startsWith('file://') ||
    activeId?.startsWith('content://') ||
    activeId?.startsWith('http');

  const imageSource = isCustomUri
    ? { uri: activeId }
    : wallpaperItem?.source || bgItem?.source || WALLPAPERS[0].source;

  return (
    <View className={`flex-1 relative bg-slate-50 ${className}`}>
      {/* Background Image Layer */}
      <Image
        source={imageSource}
        style={{ opacity: brightness }}
        className="absolute inset-0 w-full h-full"
        resizeMode="cover"
      />

      {/* Scrim / Overlay for readability */}
      {overlayOpacity > 0 && (
        <View
          style={{ opacity: overlayOpacity }}
          className="absolute inset-0 bg-black"
          pointerEvents="none"
        />
      )}

      {/* Screen Content */}
      {children}
    </View>
  );
}

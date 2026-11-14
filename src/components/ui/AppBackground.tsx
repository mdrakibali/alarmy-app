import React from 'react';
import {
  Image,
  ImageBackground,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { BackgroundTarget, useThemeStore } from '@/storage/themeStore';

interface Props {
  target?: BackgroundTarget;
  backgroundId?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function AppBackground({
  target = 'home',
  backgroundId: overrideId,
  children,
  style,
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

  const bgItem = BACKGROUND_ITEMS.find(b => b.id === activeId);
  const isCustomUri =
    activeId?.startsWith('file://') ||
    activeId?.startsWith('content://') ||
    activeId?.startsWith('http');

  const imageSource = isCustomUri
    ? { uri: activeId }
    : bgItem?.source || BACKGROUND_ITEMS[0].source;

  return (
    <View style={[styles.container, style]}>
      {/* Background Image Layer */}
      <Image
        source={imageSource}
        style={[
          StyleSheet.absoluteFill,
          {
            width: '100%',
            height: '100%',
            opacity: brightness,
          },
        ]}
        resizeMode="cover"
      />

      {/* Scrim / Overlay for readability */}
      {overlayOpacity > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000000',
              opacity: overlayOpacity,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Screen Content */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F8FAFC',
  },
});

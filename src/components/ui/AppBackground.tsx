import React from 'react';
import {
  Dimensions,
  Image,
  requireNativeComponent,
  StyleSheet,
  View,
} from 'react-native';

const MutedLoopVideo = requireNativeComponent<{
  src: string;
  muted?: boolean;
  volume?: number;
  style?: any;
}>('MutedLoopVideo');
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { WALLPAPERS } from '@/data/wallpapers';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
import { findAlbaBackground } from '@/data/albaBackgrounds';
import { findMotionMedia } from '@/data/motionMedia';
import { NativeAlarm } from '@/native/AlarmModule';
import { BackgroundTarget, useThemeStore } from '@/storage/themeStore';

interface Props {
  target?: BackgroundTarget;
  backgroundId?: string;
  videoMuted?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AppBackground({
  target = 'home',
  backgroundId: overrideId,
  videoMuted = true,
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

  const alba = findAlbaBackground(activeId);
  const motion = findMotionMedia(activeId);
  const [gifUri, setGifUri] = React.useState<string | null>(null);
  const [videoUri, setVideoUri] = React.useState<string | null>(null);
  const fileVideo =
    Boolean(activeId) &&
    (activeId!.startsWith('file://') || activeId!.startsWith('content://')) &&
    /\.(mp4|m4v|webm)(\?|$)/i.test(activeId!);
  React.useEffect(() => {
    if (target !== 'ringing' || motion?.kind !== 'gif') {
      setGifUri(null);
      return;
    }
    let live = true;
    NativeAlarm.materializeBundledMedia(motion.asset)
      .then(uri => {
        if (live) setGifUri(uri);
      })
      .catch(() => {
        if (live) setGifUri(null);
      });
    return () => {
      live = false;
    };
  }, [target, motion?.asset, motion?.kind]);
  React.useEffect(() => {
    const shouldPlay = target === 'ringing' && (motion?.kind === 'video' || fileVideo);
    if (!shouldPlay) {
      setVideoUri(null);
      return;
    }
    let live = true;
    if (fileVideo && activeId) {
      setVideoUri(activeId);
      return () => {
        live = false;
      };
    }
    if (motion?.kind === 'video') {
      NativeAlarm.materializeBundledMedia(motion.asset)
        .then(uri => {
          if (live) setVideoUri(uri);
        })
        .catch(() => {
          if (live) setVideoUri(null);
        });
    }
    return () => {
      live = false;
    };
  }, [target, motion?.asset, motion?.kind, fileVideo, activeId]);
  const animated = target === 'ringing' && !alba && !motion;
  const still = wallpaperThumb(activeId);
  const imageSource = isCustomUri
    ? { uri: activeId }
    : motion
      ? gifUri
        ? { uri: gifUri }
        : motion.poster
      : alba
      ? alba.source
      : animated
      ? wallpaperItem?.source || bgItem?.source || still || WALLPAPERS[0].source
      : still || wallpaperItem?.source || bgItem?.source || WALLPAPERS[0].source;

  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

  return (
    <View className={`flex-1 relative bg-black ${className}`}>
      {/* Background Image Layer */}
      <Image
        source={imageSource}
        style={[
          StyleSheet.absoluteFill,
          { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, opacity: brightness },
        ]}
        resizeMode="cover"
        pointerEvents="none"
      />
      {videoUri ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <MutedLoopVideo
            src={videoUri}
            muted={videoMuted}
            style={[StyleSheet.absoluteFill, { opacity: brightness }]}
          />
        </View>
      ) : null}

      {/* Scrim / Overlay for readability */}
      {overlayOpacity > 0 && (
        <View
          style={[
            StyleSheet.absoluteFill,
            // eslint-disable-next-line react-native/no-inline-styles
            {
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
              backgroundColor: 'rgba(0,0,0,1)',
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

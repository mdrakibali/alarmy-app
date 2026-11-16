import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WALLPAPERS } from '@/data/wallpapers';
import { findAlbaBackground } from '@/data/albaBackgrounds';
import { findMotionMedia } from '@/data/motionMedia';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import { useToast } from '@/components/ui/AppToast';
import { queueWallpaperPick } from './wallpaperPick';

type Props = NativeStackScreenProps<RootStackParamList, 'WallpaperPreview'>;

export function WallpaperPreviewScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const toast = useToast();
  const { wallpaperId, pickForAlarm } = route.params;
  const alba = findAlbaBackground(wallpaperId);
  const motion = findMotionMedia(wallpaperId);
  const wallpaper = WALLPAPERS.find(w => w.id === wallpaperId);
  const isCustom = wallpaperId.startsWith('file://') || wallpaperId.startsWith('content://');
  const [gifUri, setGifUri] = useState<string | null>(null);
  const source = isCustom
    ? { uri: wallpaperId }
    : gifUri
      ? { uri: gifUri }
      : motion?.poster ?? alba?.source ?? wallpaper?.source;
  const name = motion?.name ?? alba?.name ?? wallpaper?.name ?? 'Custom photo';

  const favorites = useThemeStore(s => s.favorites);
  const toggleFavorite = useThemeStore(s => s.toggleFavorite);
  const setBackground = useThemeStore(s => s.setBackground);
  const addRecentlyViewed = useThemeStore(s => s.addRecentlyViewed);
  const [playing, setPlaying] = useState(false);
  const isFav = favorites.includes(wallpaperId);

  useEffect(() => {
    if (wallpaper) addRecentlyViewed(wallpaper.id);
    if (motion) addRecentlyViewed(motion.id);
    return () => {
      try {
        Promise.resolve(NativeAlarm.stopSoundPreview()).catch(() => {});
      } catch {}
    };
  }, [wallpaper, motion, addRecentlyViewed]);

  const playLoop = async () => {
    if (!motion || motion.kind !== 'gif' || gifUri) return;
    const uri = await NativeAlarm.materializeBundledMedia(motion.asset);
    if (uri) setGifUri(uri);
  };

  const handleUseForAlarm = () => {
    queueWallpaperPick(wallpaperId);
    setBackground('alarm', wallpaperId);
    setBackground('ringing', wallpaperId);
    toast.showToast({
      title: 'Wallpaper selected',
      message: `${name} will show when this alarm rings.`,
      type: 'success',
      icon: '🖼️',
    });
    try {
      navigation.navigate('AlarmEdit');
    } catch {
      if (navigation.canGoBack()) navigation.goBack();
    }
  };

  const applyRinging = () => {
    setBackground('ringing', wallpaperId);
    toast.showToast({
      title: 'Ringing background set',
      message: name,
      type: 'success',
      icon: '🖼️',
    });
    navigation.goBack();
  };

  if (!source) {
    return (
      <View className="flex-1 bg-navy-dark items-center justify-center px-6">
        <Text className="text-white font-bold">This wallpaper is missing.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-secondary">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Image source={source} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      <View className="absolute inset-0 bg-black/25" pointerEvents="none" />
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="flex-row items-center justify-between px-5 z-20"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 rounded-full bg-black/50 items-center justify-center"
        >
          <Text className="text-white font-bold">‹</Text>
        </TouchableOpacity>
        {!isCustom ? (
          <TouchableOpacity
            onPress={() => toggleFavorite(wallpaperId)}
            className="h-10 w-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Text className="text-xl">{isFav ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {/* Alba-Style Clock & Date Live Overlay (1.7 Background Preview) */}
      <View className="items-center mt-6 z-10 px-4">
        <Text className="text-white/80 font-bold text-sm tracking-wide">
          {new Date().toLocaleDateString(undefined, {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </Text>
        <Text
          style={{
            textShadowColor: 'rgba(0, 0, 0, 0.45)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 8,
          }}
          className="text-white font-black text-7xl mt-1 tracking-tight"
        >
          07:00
        </Text>
      </View>

      <View className="flex-1" />

      {/* Bottom Action Area */}
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5 z-20">
        <View className="items-center mb-3">
          <View className="flex-row items-center bg-black/50 border border-white/20 rounded-full px-4 py-1.5">
            <Text className="text-white text-xs mr-1.5">ılıl</Text>
            <Text className="text-white text-xs font-semibold">
              Alarm rings with wallpaper visual
            </Text>
          </View>
        </View>

        <Text className="text-xl font-black text-white text-center mb-1">{name}</Text>
        {motion?.kind === 'video' ? (
          <TouchableOpacity
            onPress={async () => {
              const uri = await NativeAlarm.materializeBundledMedia(motion.asset);
              if (uri) NativeAlarm.previewVideo(uri);
            }}
            className="self-start mt-3 px-3 py-1.5 rounded-full bg-white/20"
          >
            <Text className="text-white text-xs font-bold">Play video, muted</Text>
          </TouchableOpacity>
        ) : null}
        {motion?.kind === 'gif' ? (
          <TouchableOpacity onPress={playLoop} className="self-start mt-3 px-3 py-1.5 rounded-full bg-white/20">
            <Text className="text-white text-xs font-bold">
              {gifUri ? 'Loop is playing' : 'Play silent loop'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {wallpaper?.soundId ? (
          <TouchableOpacity
            onPress={() => {
              if (playing) {
                Promise.resolve(NativeAlarm.stopSoundPreview()).catch(() => {});
                setPlaying(false);
              } else {
                setPlaying(true);
                NativeAlarm.previewSound(wallpaper.soundId ?? 'default').catch(() => setPlaying(false));
              }
            }}
            className="self-start mt-3 px-3 py-1.5 rounded-full bg-white/20"
          >
            <Text className="text-white text-xs font-bold">
              {playing ? 'Pause sound' : 'Preview sound'}
            </Text>
          </TouchableOpacity>
        ) : null}
        {pickForAlarm ? (
          <TouchableOpacity onPress={handleUseForAlarm} className="mt-4 bg-primary py-4 rounded-2xl items-center active:bg-primary-dark">
            <Text className="text-white font-black">Use for this alarm</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={applyRinging} className="mt-4 bg-primary py-4 rounded-2xl items-center active:bg-primary-dark">
            <Text className="text-white font-black">Use as ringing background</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

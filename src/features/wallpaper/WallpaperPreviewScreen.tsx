import React, { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { WALLPAPERS } from '@/data/wallpapers';
import { findAlbaBackground } from '@/data/albaBackgrounds';
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
  const wallpaper = WALLPAPERS.find(w => w.id === wallpaperId);
  const isCustom = wallpaperId.startsWith('file://') || wallpaperId.startsWith('content://');
  const source = isCustom ? { uri: wallpaperId } : alba?.source ?? wallpaper?.source;
  const name = alba?.name ?? wallpaper?.name ?? 'Custom photo';

  const favorites = useThemeStore(s => s.favorites);
  const toggleFavorite = useThemeStore(s => s.toggleFavorite);
  const setBackground = useThemeStore(s => s.setBackground);
  const addRecentlyViewed = useThemeStore(s => s.addRecentlyViewed);
  const [playing, setPlaying] = useState(false);
  const isFav = favorites.includes(wallpaperId);

  useEffect(() => {
    if (wallpaper) {
      addRecentlyViewed(wallpaper.id);
    }
    return () => {
      NativeAlarm.stopSoundPreview().catch(() => {});
    };
  }, [wallpaper, addRecentlyViewed]);

  const useForAlarm = () => {
    queueWallpaperPick(wallpaperId);
    setBackground('alarm', wallpaperId);
    toast.showToast({
      title: 'Wallpaper selected',
      message: `${name} will show when this alarm rings.`,
      type: 'success',
      icon: '🖼️',
    });
    navigation.pop(2);
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
      <View className="flex-1 bg-[#0D1612] items-center justify-center px-6">
        <Text className="text-white font-bold">This wallpaper is missing.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-[#E2A938]">Go back</Text>
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
        className="flex-row items-center justify-between px-5"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 rounded-full bg-black/50 items-center justify-center"
        >
          <Text className="text-white font-bold">✕</Text>
        </TouchableOpacity>
        {wallpaper ? (
          <TouchableOpacity
            onPress={() => toggleFavorite(wallpaper.id)}
            className="h-10 w-10 rounded-full bg-black/50 items-center justify-center"
          >
            <Text className="text-xl">{isFav ? '♥' : '♡'}</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
      <View className="flex-1" />
      <View style={{ paddingBottom: insets.bottom + 16 }} className="px-5">
        <Text className="text-2xl font-black text-white">{name}</Text>
        {wallpaper?.soundId ? (
          <TouchableOpacity
            onPress={() => {
              if (playing) {
                NativeAlarm.stopSoundPreview().catch(() => {});
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
          <TouchableOpacity onPress={useForAlarm} className="mt-4 bg-[#6B8F71] py-4 rounded-2xl items-center">
            <Text className="text-white font-black">Use for this alarm</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={applyRinging} className="mt-4 bg-[#6B8F71] py-4 rounded-2xl items-center">
            <Text className="text-white font-black">Use as ringing background</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  WALLPAPERS,
  WALLPAPER_CATEGORIES,
  WallpaperCategory,
  WallpaperItem,
} from '@/data/wallpapers';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import { WallpaperPreviewModal } from './WallpaperPreviewModal';

export function WallpaperGalleryScreen() {
  const insets = useAppInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  const currentHomeBg = useThemeStore(s => s.homeBackground);
  const favorites = useThemeStore(s => s.favorites);
  const recentlyViewed = useThemeStore(s => s.recentlyViewed);
  const setBackground = useThemeStore(s => s.setBackground);

  const [activePreview, setActivePreview] = useState<WallpaperItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Callback if opened from AlarmEdit to pick wallpaper specifically
  const onSelectForAlarm = route.params?.onSelect;

  const favoriteItems = useMemo(() => {
    return WALLPAPERS.filter(w => favorites.includes(w.id));
  }, [favorites]);

  const recentItems = useMemo(() => {
    return recentlyViewed
      .map(id => WALLPAPERS.find(w => w.id === id))
      .filter((w): w is WallpaperItem => Boolean(w));
  }, [recentlyViewed]);

  const handleCustomImport = () => {
    Alert.prompt
      ? Alert.prompt(
          'Import Custom GIF',
          'Enter direct HTTP(S) URL or local file path to animated GIF:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Add',
              onPress: (url?: string) => {
                if (url && (url.endsWith('.gif') || url.startsWith('http'))) {
                  useThemeStore.getState().addCustomImage(url);
                  useThemeStore.getState().setBackground('all', url);
                  Alert.alert('Imported!', 'Custom GIF set as wallpaper.');
                } else {
                  Alert.alert('Invalid URL', 'Please enter a valid GIF file URL.');
                }
              },
            },
          ],
        )
      : Alert.alert(
          'Custom GIF Import',
          'Place your custom GIF in src/assets/wallpapers/ or configure custom URL in settings.',
        );
  };

  return (
    <View className="flex-1 bg-black">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="px-5 pb-3 border-b border-neutral-900 bg-black/95 z-10"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full bg-neutral-900 items-center justify-center active:bg-neutral-800"
          >
            <Text className="text-white text-lg font-bold">←</Text>
          </Pressable>

          <View className="flex-row items-center">
            <Pressable
              onPress={handleCustomImport}
              className="px-3.5 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 flex-row items-center active:bg-neutral-800 mr-2"
            >
              <Text className="text-xs mr-1">➕</Text>
              <Text className="text-xs font-bold text-neutral-300">Import</Text>
            </Pressable>

            <View className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40">
              <Text className="text-[10px] font-black text-rose-400 uppercase tracking-widest">
                LIVE GIFS
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-2xl font-black text-white tracking-tight">
          Choose your alarm wallpaper
        </Text>
        <Text className="text-xs text-neutral-400 mt-0.5">
          Animated looping backgrounds to start your morning
        </Text>

        {/* Quick Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          {['All', 'Favorites', 'Recent', ...WALLPAPER_CATEGORIES.map(c => c.name)].map(tab => (
            <Pressable
              key={tab}
              onPress={() => setSelectedFilter(tab)}
              className={`mr-2 px-3.5 py-1.5 rounded-xl border ${
                selectedFilter === tab
                  ? 'bg-white border-white'
                  : 'bg-neutral-900 border-neutral-800 active:bg-neutral-800'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedFilter === tab ? 'text-black' : 'text-neutral-400'
                }`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Wallpaper Carousels */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: 12,
          paddingBottom: 110 + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Favorites Section (if any and filter allows) */}
        {(selectedFilter === 'All' || selectedFilter === 'Favorites') &&
          favoriteItems.length > 0 && (
            <View className="mb-7 px-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-white flex-row items-center">
                  ❤️ Favorites
                </Text>
                <Text className="text-xs text-neutral-500 font-bold">
                  {favoriteItems.length} wallpapers
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                {favoriteItems.map(w => (
                  <WallpaperCard
                    key={`fav-${w.id}`}
                    wallpaper={w}
                    isSelected={currentHomeBg === w.id}
                    onPress={() => setActivePreview(w)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* Recently Viewed (if filter allows) */}
        {(selectedFilter === 'All' || selectedFilter === 'Recent') &&
          recentItems.length > 0 && (
            <View className="mb-7 px-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-white">
                  🕒 Recently Viewed
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                {recentItems.map(w => (
                  <WallpaperCard
                    key={`rec-${w.id}`}
                    wallpaper={w}
                    isSelected={currentHomeBg === w.id}
                    onPress={() => setActivePreview(w)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

        {/* 12 Horizontal Category Sections */}
        {WALLPAPER_CATEGORIES.map(cat => {
          if (selectedFilter !== 'All' && selectedFilter !== cat.name) {
            return null;
          }

          const items = WALLPAPERS.filter(w => w.category === cat.name);
          if (items.length === 0) return null;

          return (
            <View key={cat.id} className="mb-7 px-5">
              {/* Category Header */}
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-base font-black text-white">
                  {cat.icon} {cat.name}
                </Text>
                <Text className="text-xs text-neutral-500 font-bold">
                  {items.length} items
                </Text>
              </View>

              {/* Horizontal Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5 px-5"
              >
                {items.map(w => (
                  <WallpaperCard
                    key={w.id}
                    wallpaper={w}
                    isSelected={currentHomeBg === w.id}
                    onPress={() => setActivePreview(w)}
                  />
                ))}
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      {/* Full-Screen Preview Modal */}
      <WallpaperPreviewModal
        visible={Boolean(activePreview)}
        wallpaper={activePreview}
        onClose={() => setActivePreview(null)}
        onApplyForAlarm={wallpaperId => {
          if (onSelectForAlarm) {
            onSelectForAlarm(wallpaperId);
          }
        }}
      />
    </View>
  );
}

function WallpaperCard({
  wallpaper,
  isSelected,
  onPress,
}: {
  wallpaper: WallpaperItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-3 h-52 w-36 rounded-3xl overflow-hidden justify-between items-center relative border-2 ${
        isSelected
          ? 'border-[#FF385C] scale-102 shadow-lg'
          : 'border-transparent bg-neutral-900 active:scale-98'
      }`}
      style={{ backgroundColor: isSelected ? '#1E1E1E' : '#141414' }}
    >
      {/* Animated Looping GIF Image */}
      <Image
        source={wallpaper.source}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
        }}
        resizeMode="cover"
      />

      {/* Top Favorite indicator badge */}
      <View className="w-full flex-row justify-end p-2 z-10">
        {isSelected && (
          <View className="h-6 w-6 rounded-full bg-[#FF385C] items-center justify-center shadow-md">
            <Text className="text-white text-[10px] font-black">✓</Text>
          </View>
        )}
      </View>

      {/* Bottom Title Bar with Music Note Icon (Matching Alarmy Reference) */}
      <View className="w-full py-2.5 px-2 bg-black/60 backdrop-blur-md z-10 border-t border-white/10">
        <Text
          className={`text-xs font-black ${
            isSelected ? 'text-[#FF385C]' : 'text-white'
          }`}
          numberOfLines={1}
        >
          ♪ {wallpaper.name}
        </Text>
      </View>
    </Pressable>
  );
}

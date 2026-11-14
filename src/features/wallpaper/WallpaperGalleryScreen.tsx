import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  WALLPAPERS,
  WALLPAPER_CATEGORIES,
  WallpaperItem,
} from '@/data/wallpapers';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import { useToast } from '@/components/ui/AppToast';
import { WallpaperPreviewModal } from './WallpaperPreviewModal';

export function WallpaperGalleryScreen() {
  const insets = useAppInsets();
  const toast = useToast();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();

  const currentHomeBg = useThemeStore(s => s.homeBackground);
  const favorites = useThemeStore(s => s.favorites);
  const recentlyViewed = useThemeStore(s => s.recentlyViewed);

  const [activePreview, setActivePreview] = useState<WallpaperItem | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  // Callback if opened from AlarmEdit to pick wallpaper specifically
  const onSelectForAlarm = route.params?.onSelect;

  const handleCardPress = (w: WallpaperItem) => {
    if (onSelectForAlarm) {
      onSelectForAlarm(w.id);
      toast.showToast({
        title: 'Wallpaper Selected! ✨',
        message: `"${w.name}" selected for your alarm.`,
        icon: '🖼️',
        type: 'success',
      });
      navigation.goBack();
    } else {
      setActivePreview(w);
    }
  };

  const favoriteItems = useMemo(() => {
    return WALLPAPERS.filter(w => favorites.includes(w.id));
  }, [favorites]);

  const recentItems = useMemo(() => {
    return recentlyViewed
      .map(id => WALLPAPERS.find(w => w.id === id))
      .filter((w): w is WallpaperItem => Boolean(w));
  }, [recentlyViewed]);

  const handleCustomImport = () => {
    toast.showToast({
      title: 'Import Custom GIF 🖼️',
      message:
        'Place your custom GIF in src/assets/wallpapers/ or configure URL in settings.',
      icon: '💡',
      type: 'info',
    });
  };

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="px-5 pb-3 border-b border-slate-100 bg-white/95 z-10"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
          >
            <Text className="text-slate-800 text-lg font-bold">←</Text>
          </Pressable>

          <View className="flex-row items-center">
            <Pressable
              onPress={handleCustomImport}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 flex-row items-center active:bg-slate-200 mr-2"
            >
              <Text className="text-xs mr-1">➕</Text>
              <Text className="text-xs font-bold text-slate-700">Import</Text>
            </Pressable>

            <View className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200">
              <Text className="text-[10px] font-black text-[#FF385C] uppercase tracking-widest">
                LIVE GIFS
              </Text>
            </View>
          </View>
        </View>

        <Text className="text-2xl font-black text-slate-900 tracking-tight">
          Choose your alarm wallpaper
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
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
                  ? 'bg-[#0F172A] border-[#0F172A]'
                  : 'bg-white border-slate-200 active:bg-slate-50'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedFilter === tab ? 'text-white' : 'text-slate-600'
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
                <Text className="text-base font-black text-slate-900 flex-row items-center">
                  ❤️ Favorites
                </Text>
                <Text className="text-xs text-slate-400 font-bold">
                  {favoriteItems.length} wallpapers
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                {favoriteItems.map(w => (
                  <WallpaperCard
                    key={`fav-${w.id}`}
                    wallpaper={w}
                    isSelected={currentHomeBg === w.id}
                    onPress={() => handleCardPress(w)}
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
                <Text className="text-base font-black text-slate-900">
                  🕒 Recently Viewed
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                {recentItems.map(w => (
                  <WallpaperCard
                    key={`rec-${w.id}`}
                    wallpaper={w}
                    isSelected={currentHomeBg === w.id}
                    onPress={() => handleCardPress(w)}
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
                <Text className="text-base font-black text-slate-900">
                  {cat.icon} {cat.name}
                </Text>
                <Text className="text-xs text-slate-400 font-bold">
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
                    onPress={() => handleCardPress(w)}
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
            navigation.goBack();
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
      className={`mr-3 h-52 w-36 rounded-3xl overflow-hidden justify-between items-center relative border-2 bg-slate-50 ${
        isSelected
          ? 'border-[#FF385C] scale-102 shadow-lg'
          : 'border-slate-200 bg-white shadow-xs active:scale-98'
      }`}
    >
      {/* Animated Looping GIF Image */}
      <Image
        source={wallpaper.source}
        className="absolute inset-0 w-full h-full"
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


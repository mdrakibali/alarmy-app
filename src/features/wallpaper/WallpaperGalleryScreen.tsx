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

  const currentAlarmBg = useThemeStore(s => s.alarmBackground);
  const favorites = useThemeStore(s => s.favorites);
  const recentlyViewed = useThemeStore(s => s.recentlyViewed);

  const [activePreview, setActivePreview] = useState<WallpaperItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Trending');

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

  // Only render the active category's items (6-8 items max) to prevent memory exhaustion on Android
  const displayedItems = useMemo(() => {
    if (selectedCategory === 'Favorites') {
      return WALLPAPERS.filter(w => favorites.includes(w.id));
    }
    if (selectedCategory === 'Recent') {
      return recentlyViewed
        .map(id => WALLPAPERS.find(w => w.id === id))
        .filter((w): w is WallpaperItem => Boolean(w));
    }
    if (selectedCategory === 'All') {
      return WALLPAPERS.slice(0, 10);
    }
    return WALLPAPERS.filter(w => w.category === selectedCategory);
  }, [selectedCategory, favorites, recentlyViewed]);

  const categoryTabs = [
    'Trending',
    'KPOP Trending',
    'Anime',
    'Cute Animals',
    'Daily Motivation',
    'Aesthetic',
    'Galaxy',
    'Gaming',
    'Favorites',
    'All',
  ];

  return (
    <View className="flex-1 bg-[#F5F6F8]">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="px-5 pb-3 border-b border-slate-100 bg-white z-10 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center active:bg-slate-200"
          >
            <Text className="text-slate-800 text-lg font-bold">←</Text>
          </Pressable>

          <View className="px-3 py-1 rounded-full bg-[#EBF3ED] border border-[#6B8F71]/30">
            <Text className="text-[10px] font-black text-[#4E7D5B] uppercase tracking-widest">
              LIVE WALLPAPERS
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-black text-slate-900 tracking-tight">
          Choose alarm wallpaper
        </Text>
        <Text className="text-xs text-slate-500 mt-0.5">
          Select an animated background for your morning wake-up
        </Text>

        {/* Category Horizontal Filter Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          {categoryTabs.map(tab => (
            <Pressable
              key={tab}
              hitSlop={6}
              onPress={() => setSelectedCategory(tab)}
              className={`mr-2 px-3.5 py-1.5 rounded-xl border ${
                selectedCategory === tab
                  ? 'bg-[#0F172A] border-[#0F172A]'
                  : 'bg-white border-slate-200 active:bg-slate-100'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  selectedCategory === tab ? 'text-white' : 'text-slate-600'
                }`}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* 2-Column Responsive Grid (Only active category items mounted = 60fps) */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: insets.bottom + 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {displayedItems.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-3xl mb-2">🖼️</Text>
            <Text className="text-sm font-bold text-slate-700">
              No wallpapers found in this category
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between">
            {displayedItems.map(w => {
              const isSelected = currentAlarmBg === w.id;
              return (
                <Pressable
                  key={w.id}
                  hitSlop={8}
                  onPress={() => handleCardPress(w)}
                  className={`w-[48%] h-56 mb-4 rounded-3xl overflow-hidden justify-between items-center relative border-2 ${
                    isSelected
                      ? 'border-[#4E7D5B] shadow-md bg-[#EBF3ED]/40'
                      : 'border-slate-200 bg-white shadow-xs'
                  }`}
                >
                  {/* Animated Looping GIF Image */}
                  <Image
                    source={w.source}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                    pointerEvents="none"
                  />

                  {/* Top Favorite / Selected indicator badge */}
                  <View
                    className="w-full flex-row justify-end p-2.5 z-10"
                    pointerEvents="none"
                  >
                    {isSelected && (
                      <View className="h-6 w-6 rounded-full bg-[#4E7D5B] border border-white items-center justify-center shadow-md">
                        <Text className="text-white text-[10px] font-black">✓</Text>
                      </View>
                    )}
                  </View>

                  {/* Bottom Title Bar */}
                  <View
                    className="w-full py-2 px-2 bg-black/70 z-10 border-t border-white/10"
                    pointerEvents="none"
                  >
                    <Text
                      className={`text-xs font-black text-center ${
                        isSelected ? 'text-[#E2A938]' : 'text-white'
                      }`}
                      numberOfLines={1}
                    >
                      ♪ {w.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
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

import React, { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeAlarm } from '@/native/AlarmModule';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import type { WallpaperItem } from '@/data/wallpapers';
import { useToast } from '@/components/ui/AppToast';

interface Props {
  visible: boolean;
  wallpaper: WallpaperItem | null;
  onClose: () => void;
  onApplyForAlarm?: (wallpaperId: string) => void;
}

export function WallpaperPreviewModal({
  visible,
  wallpaper,
  onClose,
  onApplyForAlarm,
}: Props) {
  const insets = useAppInsets();
  const toast = useToast();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showApplySheet, setShowApplySheet] = useState(false);

  const favorites = useThemeStore(s => s.favorites);
  const toggleFavorite = useThemeStore(s => s.toggleFavorite);
  const setBackground = useThemeStore(s => s.setBackground);
  const addRecentlyViewed = useThemeStore(s => s.addRecentlyViewed);

  const isFav = wallpaper ? favorites.includes(wallpaper.id) : false;

  useEffect(() => {
    if (visible && wallpaper) {
      addRecentlyViewed(wallpaper.id);
    }
    return () => {
      NativeAlarm.stopSoundPreview();
      setIsPlayingAudio(false);
    };
  }, [visible, wallpaper, addRecentlyViewed]);

  if (!wallpaper) return null;

  const handleToggleAudio = () => {
    if (!wallpaper.soundId) return;

    if (isPlayingAudio) {
      NativeAlarm.stopSoundPreview().catch(() => {});
      setIsPlayingAudio(false);
    } else {
      setIsPlayingAudio(true);
      NativeAlarm.previewSound(wallpaper.soundId).catch(() => {});
      // Reset after 4 seconds
      setTimeout(() => setIsPlayingAudio(false), 4500);
    }
  };

  const handleApplyTo = (target: 'all' | 'alarm' | 'ringing') => {
    const targetLabel =
      target === 'all'
        ? 'all screens'
        : target === 'alarm'
        ? 'your alarm screen'
        : 'the ringing alarm screen';
    setBackground(target, wallpaper.id);
    if (onApplyForAlarm) {
      onApplyForAlarm(wallpaper.id);
    }
    setShowApplySheet(false);
    onClose();
    toast.showToast({
      title: 'Wallpaper Applied! ✨',
      message: `"${wallpaper.name}" set for ${targetLabel}.`,
      icon: '🖼️',
      type: 'success',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black relative justify-between">
        {/* Full-Screen Animated GIF */}
        <Image
          source={wallpaper.source}
          className="absolute inset-0 w-full h-full"
          resizeMode="cover"
        />

        {/* Dark Top & Bottom Vignette Overlays for UI contrast */}
        <View
          className="absolute inset-0 bg-black/25"
          pointerEvents="none"
        />

        {/* Top Header Bar */}
        <View
          style={{ paddingTop: Math.max(insets.top, 16) }}
          className="flex-row items-center justify-between px-5 pb-3 z-10"
        >
          {/* Close button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-10 w-10 rounded-full bg-black/50 items-center justify-center border border-white/20"
          >
            <Text className="text-white text-base font-bold">✕</Text>
          </TouchableOpacity>

          <View className="items-center px-3 py-1 rounded-full bg-black/60 border border-white/15">
            <Text className="text-white text-[11px] font-black tracking-widest uppercase">
              {wallpaper.category}
            </Text>
          </View>

          {/* Favorite button */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => toggleFavorite(wallpaper.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="h-10 w-10 rounded-full bg-black/50 items-center justify-center border border-white/20"
          >
            <Text className="text-xl">{isFav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
        </View>

        {/* Center Sound Wave / Playing Indicator if audio is on */}
        {isPlayingAudio && (
          <View className="items-center justify-center self-center bg-black/60 px-5 py-3 rounded-2xl border border-white/20">
            <Text className="text-white text-sm font-bold">
              🔊 Playing: {wallpaper.soundName || 'Associated Sound'}
            </Text>
          </View>
        )}

        {/* Bottom Floating Card & Controls */}
        <View
          style={{ paddingBottom: insets.bottom + 12 }}
          className="px-5 pt-6 bg-gradient-to-t from-black via-black/80 to-transparent z-10"
        >
          {/* Wallpaper Title and Sound Info */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="text-2xl font-black text-white tracking-tight flex-1 mr-3">
                {wallpaper.name}
              </Text>
              <View className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40">
                <Text className="text-[10px] font-black text-emerald-300 uppercase">
                  ANIMATED GIF
                </Text>
              </View>
            </View>

            {/* Sound Pill / Preview audio */}
            {wallpaper.soundId && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleToggleAudio}
                className="flex-row items-center self-start mt-2 px-3 py-1.5 rounded-full bg-white/20 border border-white/30"
              >
                <Text className="text-sm mr-2">{isPlayingAudio ? '❚❚' : '▶'}</Text>
                <Text className="text-xs font-bold text-white">
                  {isPlayingAudio
                    ? 'Pause Sound Preview'
                    : `♪ ${wallpaper.soundName || 'Preview Sound'}`}
                </Text>
              </TouchableOpacity>
            )}

            <Text className="text-[11px] font-medium text-white/60 mt-2">
              {wallpaper.attribution} • {wallpaper.license}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowApplySheet(true)}
              className="flex-1 bg-primary py-4 rounded-2xl items-center shadow-lg mr-2 active:bg-primary-dark"
            >
              <Text className="text-white text-base font-black tracking-wide">
                Apply Wallpaper ✨
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Target Selection Bottom Sheet */}
        {showApplySheet && (
          <View className="absolute inset-0 bg-black/70 justify-end z-50">
            <TouchableOpacity
              activeOpacity={1}
              className="absolute inset-0"
              onPress={() => setShowApplySheet(false)}
            />
            <View
              style={{ paddingBottom: insets.bottom + 16 }}
              className="bg-white rounded-t-3xl p-6 border-t border-slate-200 z-10"
            >
              <View className="h-1 w-12 bg-slate-300 rounded-full self-center mb-5" />
              <Text className="text-lg font-black text-slate-900 text-center mb-1">
                Apply Animated Wallpaper
              </Text>
              <Text className="text-xs text-slate-500 text-center mb-5">
                Choose where to display "{wallpaper.name}"
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleApplyTo('all')}
                className="p-4 rounded-2xl bg-slate-50 mb-2.5 border border-slate-200"
              >
                <Text className="text-sm font-extrabold text-slate-900">
                  📱 Apply to All (Global Default)
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Sets as background for Home, Alarm, and Ringing screens
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleApplyTo('alarm')}
                className="p-4 rounded-2xl bg-slate-50 mb-2.5 border border-slate-200"
              >
                <Text className="text-sm font-extrabold text-slate-900">
                  ⏰ Apply to Alarm Screen
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Display when viewing or configuring alarms
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleApplyTo('ringing')}
                className="p-4 rounded-2xl bg-slate-50 mb-4 border border-slate-200"
              >
                <Text className="text-sm font-extrabold text-slate-900">
                  🔔 Apply to Ringing Screen
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Shows full-screen looping GIF when morning alarm rings
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowApplySheet(false)}
                className="py-3.5 rounded-2xl bg-slate-100 items-center border border-slate-200"
              >
                <Text className="text-sm font-bold text-slate-600">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}


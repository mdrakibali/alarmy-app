import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ALBA_BACKGROUNDS, AlbaGroup } from '@/data/albaBackgrounds';
import { MOTION_MEDIA } from '@/data/motionMedia';
import { LOTTIE_MEDIA } from '@/data/lottieMedia';
import { WALLPAPERS } from '@/data/wallpapers';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import LottieView from 'lottie-react-native';

type GroupId = AlbaGroup | 'Video' | 'Lottie' | 'Motion' | 'Custom' | 'Favorites';

const GROUPS: GroupId[] = [
  'Video',
  'Lottie',
  'Motion',
  'Nature',
  'Mountains',
  'Flowers',
  'Minimal',
  'Abstract',
  'Motivational',
  'Night',
  'Custom',
  'Favorites',
];

const Card = React.memo(function WallpaperCard({
  id,
  name,
  selected,
  source,
  lottieSource,
  badge,
  onPress,
}: {
  id: string;
  name: string;
  selected: boolean;
  source?: number | { uri: string };
  lottieSource?: any;
  badge?: string;
  onPress: (id: string) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(id)}
      style={{ width: '48%', height: 224, marginBottom: 16 }}
      className={`rounded-3xl overflow-hidden border-2 bg-slate-100 ${
        selected ? 'border-primary' : 'border-slate-200'
      }`}
    >
      {lottieSource ? (
        <LottieView
          source={lottieSource}
          autoPlay
          loop
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          resizeMode="cover"
        />
      ) : source ? (
        <Image
          pointerEvents="none"
          source={source}
          resizeMethod="resize"
          resizeMode="cover"
          className="absolute inset-0 w-full h-full"
        />
      ) : null}
      {badge ? (
        <View pointerEvents="none" className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70">
          <Text className="text-[10px] font-black text-white">{badge}</Text>
        </View>
      ) : null}
      <View pointerEvents="none" className="flex-1 justify-end">
        <View className="w-full py-2 px-2 bg-black/70">
          <Text className="text-xs font-black text-white text-center" numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

export function WallpaperGalleryScreen() {
  const insets = useAppInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const pickForAlarm = Boolean(route.params?.pickForAlarm);

  const currentAlarmBg = useThemeStore(s => s.alarmBackground);
  const favorites = useThemeStore(s => s.favorites);
  const customImages = useThemeStore(s => s.customImages);
  const [selectedGroup, setSelectedGroup] = React.useState<GroupId>('Motion');
  const [query, setQuery] = React.useState('');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (name: string) => !q || name.toLowerCase().includes(q);
    const motionOf = (kind: 'gif' | 'video') =>
      MOTION_MEDIA.filter(item => item.kind === kind && matches(item.name)).map(item => ({
        id: item.id,
        name: item.name,
        source: item.poster,
        badge: kind === 'gif' ? 'GIF' : 'MP4',
      }));
    if (selectedGroup === 'Favorites') {
      const stills = ALBA_BACKGROUNDS.filter(item => favorites.includes(item.id) && matches(item.name)).map(item => ({
        id: item.id,
        name: item.name,
        source: item.source as number,
      }));
      const motion = MOTION_MEDIA.filter(item => favorites.includes(item.id) && matches(item.name)).map(item => ({
        id: item.id,
        name: item.name,
        source: item.poster,
        badge: item.kind === 'gif' ? 'GIF' : 'MP4',
      }));
      const legacy = WALLPAPERS.filter(w => favorites.includes(w.id) && matches(w.name)).map(w => ({
        id: w.id,
        name: w.name,
        source: wallpaperThumb(w.id) ?? w.source,
      }));
      return [...stills, ...motion, ...legacy];
    }
    if (selectedGroup === 'Custom') {
      return customImages.map(uri => ({
        id: uri,
        name: 'Custom photo',
        source: { uri },
        custom: true as const,
      }));
    }
    if (selectedGroup === 'Motion') return motionOf('gif');
    if (selectedGroup === 'Video') return motionOf('video');
    if (selectedGroup === 'Lottie') {
      return LOTTIE_MEDIA.filter(item => matches(item.name)).map(item => ({
        id: item.id,
        name: item.name,
        lottieSource: item.source,
        badge: 'LOTTIE',
      }));
    }
    return ALBA_BACKGROUNDS.filter(item => item.group === selectedGroup && matches(item.name)).map(item => ({
      id: item.id,
      name: item.name,
      source: item.source,
    }));
  }, [selectedGroup, favorites, customImages, query]);

  const opening = React.useRef(false);
  const onPress = useCallback(
    (id: string) => {
      if (opening.current) return;
      opening.current = true;
      navigation.navigate('WallpaperPreview', { wallpaperId: id, pickForAlarm });
      setTimeout(() => {
        opening.current = false;
      }, 700);
    },
    [navigation, pickForAlarm],
  );

  const handlePickCustomPhoto = useCallback(async () => {
    try {
      const uri = await NativeAlarm.pickLocalImage();
      if (uri) {
        useThemeStore.getState().addCustomImage(uri);
        navigation.navigate('WallpaperPreview', { wallpaperId: uri, pickForAlarm });
      }
    } catch (e) {
      console.warn('Failed to pick photo', e);
    }
  }, [navigation, pickForAlarm]);

  const renderItem = useCallback(
    ({
      item,
    }: {
      item: {
        id: string;
        name: string;
        source?: number | { uri: string };
        lottieSource?: any;
        badge?: string;
        custom?: boolean;
      };
    }) => {
      return (
        <Card
          id={item.id}
          name={item.name}
          selected={currentAlarmBg === item.id}
          source={item.source}
          lottieSource={item.lottieSource}
          badge={item.badge}
          onPress={onPress}
        />
      );
    },
    [currentAlarmBg, onPress],
  );

  return (
    <View className="flex-1 bg-background">
      <View
        style={{ paddingTop: Math.max(insets.top, 14) }}
        className="px-5 pb-3 border-b border-slate-100 bg-white"
      >
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center"
          >
            <Text className="text-slate-800 text-lg font-bold">←</Text>
          </TouchableOpacity>
          <Text className="text-[10px] font-black text-primary uppercase tracking-widest">
            Wallpapers
          </Text>
        </View>
        <Text className="text-2xl font-black text-navy">Choose alarm wallpaper</Text>
        <Text className="text-xs text-subtext mt-0.5">
          The grid stays still. A GIF plays on the alarm. A video plays muted in preview.
        </Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search wallpapers"
          placeholderTextColor="#556889"
          className="mt-3 bg-background border border-slate-200 rounded-xl px-3 py-2 text-sm text-navy"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {GROUPS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setSelectedGroup(tab)}
              className={`mr-2 px-3.5 py-1.5 rounded-xl border ${
                selectedGroup === tab ? 'bg-navy border-navy' : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-xs font-bold ${selectedGroup === tab ? 'text-white' : 'text-subtext'}`}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        numColumns={2}
        windowSize={5}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        removeClippedSubviews
        ListHeaderComponent={
          selectedGroup === 'Custom' ? (
            <View className="px-4 pt-3 pb-2">
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickCustomPhoto}
                className="w-full bg-primary py-3.5 rounded-2xl items-center shadow-sm flex-row justify-center active:bg-primary-dark"
              >
                <Text className="text-white text-sm font-black mr-2">📷</Text>
                <Text className="text-white text-sm font-black">
                  Upload Custom Photo from Device
                </Text>
              </TouchableOpacity>
            </View>
          ) : undefined
        }
        {...(items.length > 0
          ? { columnWrapperStyle: { justifyContent: 'space-between' as const, paddingHorizontal: 16 } }
          : {})}
        ListEmptyComponent={
          <View className="items-center py-20 px-6">
            <Text className="text-sm font-bold text-navy">Nothing in this category yet</Text>
            {selectedGroup === 'Custom' ? (
              <TouchableOpacity
                onPress={handlePickCustomPhoto}
                className="mt-4 bg-primary px-4 py-3 rounded-2xl active:bg-primary-dark"
              >
                <Text className="text-white font-bold">Import a photo</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs text-subtext mt-1 text-center">
                Mark wallpapers from the preview screen.
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

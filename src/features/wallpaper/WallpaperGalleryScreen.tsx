import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WALLPAPERS, WallpaperItem } from '@/data/wallpapers';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';

type GroupId =
  | 'Nature'
  | 'Minimal'
  | 'Animated'
  | 'Motivational'
  | 'Custom'
  | 'Favorites';

const GROUPS: { id: GroupId; categories: string[] }[] = [
  { id: 'Nature', categories: ['Nature', 'Galaxy'] },
  { id: 'Minimal', categories: ['Minimal Animation', 'Aesthetic'] },
  { id: 'Animated', categories: ['Trending', 'KPOP Trending', 'Anime', 'Cute Animals', 'Funny Memes', 'Gaming', 'Love & Romance'] },
  { id: 'Motivational', categories: ['Daily Motivation'] },
  { id: 'Custom', categories: [] },
  { id: 'Favorites', categories: [] },
];

const Card = React.memo(function WallpaperCard({
  id,
  name,
  selected,
  source,
  onPress,
}: {
  id: string;
  name: string;
  selected: boolean;
  source: number | { uri: string };
  onPress: (id: string) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(id)}
      style={{ width: '48%', height: 224, marginBottom: 16 }}
      className={`rounded-3xl overflow-hidden border-2 ${
        selected ? 'border-[#6B8F71]' : 'border-slate-200'
      }`}
    >
      <Image source={source} className="absolute inset-0 w-full h-full" resizeMode="cover" />
      <View className="flex-1 justify-end">
        <View className="w-full py-2 px-2 bg-black/70">
          <Text className="text-xs font-black text-white text-center" numberOfLines={1}>
            {name}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
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
  const [selectedGroup, setSelectedGroup] = React.useState<GroupId>('Nature');

  const items = useMemo(() => {
    if (selectedGroup === 'Favorites') {
      return WALLPAPERS.filter(w => favorites.includes(w.id));
    }
    if (selectedGroup === 'Custom') {
      return customImages.map(uri => ({
        id: uri,
        name: 'Custom photo',
        custom: true as const,
      }));
    }
    const group = GROUPS.find(g => g.id === selectedGroup);
    return WALLPAPERS.filter(w => group?.categories.includes(w.category));
  }, [selectedGroup, favorites, customImages]);

  const onPress = useCallback(
    (id: string) => {
      navigation.navigate('WallpaperPreview', { wallpaperId: id, pickForAlarm });
    },
    [navigation, pickForAlarm],
  );

  const renderItem = useCallback(
    ({ item }: { item: WallpaperItem | { id: string; name: string; custom: true } }) => {
      const custom = 'custom' in item && item.custom;
      const thumb = custom ? { uri: item.id } : wallpaperThumb(item.id);
      if (!thumb) {
        return null;
      }
      return (
        <Card
          id={item.id}
          name={item.name}
          selected={currentAlarmBg === item.id}
          source={thumb}
          onPress={onPress}
        />
      );
    },
    [currentAlarmBg, onPress],
  );

  return (
    <View className="flex-1 bg-[#FBFBF9]">
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
          <Text className="text-[10px] font-black text-[#6B8F71] uppercase tracking-widest">
            Wallpapers
          </Text>
        </View>
        <Text className="text-2xl font-black text-[#1A2E22]">Choose alarm wallpaper</Text>
        <Text className="text-xs text-[#5E7166] mt-0.5">
          Posters stay still. Animation plays only in preview.
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          {GROUPS.map(tab => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setSelectedGroup(tab.id)}
              className={`mr-2 px-3.5 py-1.5 rounded-xl border ${
                selectedGroup === tab.id ? 'bg-[#1A2E22] border-[#1A2E22]' : 'bg-white border-slate-200'
              }`}
            >
              <Text className={`text-xs font-bold ${selectedGroup === tab.id ? 'text-white' : 'text-[#5E7166]'}`}>
                {tab.id}
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
        {...(items.length > 0
          ? { columnWrapperStyle: { justifyContent: 'space-between' as const, paddingHorizontal: 16 } }
          : {})}
        ListEmptyComponent={
          <View className="items-center py-20 px-6">
            <Text className="text-sm font-bold text-[#1A2E22]">Nothing in this category yet</Text>
            {selectedGroup === 'Custom' ? (
              <TouchableOpacity
                onPress={async () => {
                  const uri = await NativeAlarm.pickLocalImage();
                  if (uri) {
                    useThemeStore.getState().addCustomImage(uri);
                  }
                }}
                className="mt-4 bg-[#6B8F71] px-4 py-3 rounded-2xl"
              >
                <Text className="text-white font-bold">Import a photo</Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-xs text-[#5E7166] mt-1 text-center">
                Mark wallpapers from the preview screen.
              </Text>
            )}
          </View>
        }
      />
    </View>
  );
}

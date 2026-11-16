import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { OFFLINE_PACK } from '@/data/offlinePack';
import { NativeAlarm, type OfflineDownloadEvent, type OfflineFile } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAppInsets } from '@/utils/safeArea';

export function OfflineLibraryScreen() {
  const insets = useAppInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [files, setFiles] = useState<OfflineFile[]>([]);
  const [progress, setProgress] = useState<Record<string, OfflineDownloadEvent>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setFiles(await NativeAlarm.listOfflineMedia());
  }, []);

  useEffect(() => {
    refresh();
    return NativeAlarm.onOfflineDownload(event => {
      setProgress(current => ({ ...current, [event.id]: event }));
      if (event.state === 'done' || event.state === 'error') {
        setBusyId(null);
        refresh();
      }
    });
  }, [refresh]);

  return (
    <View className="flex-1 bg-background">
      <View style={{ paddingTop: Math.max(insets.top, 14) }} className="px-5 pb-3 bg-white border-b border-slate-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="h-10 w-10 rounded-full bg-slate-100 items-center justify-center">
          <Text className="text-slate-800 text-lg font-bold">←</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-black text-navy mt-3">Offline downloads</Text>
        <Text className="text-xs text-subtext mt-1">
          The built-in photos, loops, and sounds stay on the phone. These extras download once into the app’s private folder.
        </Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
        {OFFLINE_PACK.map(item => {
          const saved = files.find(file => file.id === item.fileName);
          const event = progress[item.id];
          const running = busyId === item.id && event?.state === 'progress';
          const ratio = event && event.total > 0 ? Math.min(1, event.received / event.total) : 0;
          return (
            <View key={item.id} className="bg-white rounded-3xl p-4 mb-3 border border-slate-100">
              <Text className="text-base font-black text-navy">{item.title}</Text>
              <Text className="text-[11px] text-subtext mt-1">
                {item.kind === 'video' ? 'MP4' : 'Alarm sound'}
                {saved ? ` · saved ${(saved.bytes / (1024 * 1024)).toFixed(1)} MB` : ' · not on this phone'}
              </Text>
              {running ? (
                <View className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <View style={{ width: `${Math.round(ratio * 100)}%` }} className="h-2 bg-primary" />
                </View>
              ) : null}
              {event?.state === 'error' ? (
                <Text className="text-xs text-red-700 mt-2">{event.message || 'Download failed. The partial file was removed.'}</Text>
              ) : null}
              <View className="flex-row mt-3">
                <TouchableOpacity
                  disabled={running}
                  onPress={async () => {
                    setBusyId(item.id);
                    setProgress(current => ({
                      ...current,
                      [item.id]: { id: item.id, state: 'progress', received: 0, total: 0 },
                    }));
                    const path = await NativeAlarm.downloadOfflineMedia(item.id, item.url, item.fileName);
                    if (!path) setBusyId(null);
                  }}
                  className="mr-2 px-3 py-2 rounded-xl bg-navy"
                >
                  <Text className="text-white text-xs font-bold">{saved ? 'Downloaded' : running ? 'Downloading' : 'Download'}</Text>
                </TouchableOpacity>
                {saved && item.kind === 'video' ? (
                  <TouchableOpacity
                    onPress={() => NativeAlarm.previewVideo(saved.path)}
                    className="mr-2 px-3 py-2 rounded-xl bg-primary"
                  >
                    <Text className="text-white text-xs font-bold">Play muted</Text>
                  </TouchableOpacity>
                ) : null}
                {saved ? (
                  <TouchableOpacity
                    onPress={async () => {
                      await NativeAlarm.deleteOfflineMedia(item.fileName);
                      refresh();
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100"
                  >
                    <Text className="text-xs font-bold text-navy">Delete</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

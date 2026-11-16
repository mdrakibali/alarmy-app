import React, { useEffect, useState } from 'react';
import {
  AppState,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Row, Section } from '@/components/ui/Section';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { wallpaperThumb } from '@/data/wallpaperThumbs';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';
import { suggestChronotypeHour, buildBackupPayload } from '@/features/v2/localIntelligence';
import { useToast } from '@/components/ui/AppToast';

export function SettingsScreen() {
  const insets = useAppInsets();
  const toast = useToast();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(true);
  const [batteryIgnored, setBatteryIgnored] = useState(true);
  const [uninstallProtection, setUninstallProtection] = useState(false);
  const [eveningType, setEveningType] = useState(false);
  const [lateSleep, setLateSleep] = useState(false);
  const suggestedHour = suggestChronotypeHour({ evening: eveningType, lateSleep });
  const addAlarm = useAlarmStore(s => s.addAlarm);

  const homeBg = useThemeStore(s => s.homeBackground);
  const brightness = useThemeStore(s => s.brightness);
  const overlayOpacity = useThemeStore(s => s.overlayOpacity);
  const setBackground = useThemeStore(s => s.setBackground);
  const setBrightness = useThemeStore(s => s.setBrightness);
  const setOverlayOpacity = useThemeStore(s => s.setOverlayOpacity);
  const resetTheme = useThemeStore(s => s.resetTheme);

  useEffect(() => {
    checkPermissions();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') checkPermissions();
    });
    return () => sub.remove();
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const exact = await NativeAlarm.canScheduleExactAlarms();
      setExactAlarmAllowed(exact);
      const battery = await NativeAlarm.isIgnoringBatteryOptimizations();
      setBatteryIgnored(battery);
      const admin = await NativeAlarm.isUninstallProtectionEnabled();
      setUninstallProtection(admin);
    }
  };

  const testAlarmIn5Seconds = () => {
    const now = new Date();
    // 10 seconds from now
    now.setSeconds(now.getSeconds() + 10);

    addAlarm({
      hour: now.getHours(),
      minute: now.getMinutes(),
      label: 'Test Alarm ⏰',
      repeatDays: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      soundId: 'alarm_rooster',
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 3, maxCount: 2 },
      missions: ['math'],
    });

    toast.showToast({
      title: 'Test Alarm Scheduled! ⏳',
      message:
        'Set for ~10 seconds from now with Math Mission. Lock phone to test!',
      icon: '🔔',
      type: 'success',
    });
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-5"
      contentContainerStyle={{
        paddingTop: insets.top + 10,
        paddingBottom: 140 + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
        Settings
      </Text>

      <Section title="Guest">
        <View className="p-4">
          <Text className="text-sm text-navy font-bold">Using Alba as a guest</Text>
          <Text className="text-xs text-subtext mt-1">
            No account is required. Alarms stay on this phone.
          </Text>
          <Text className="text-xs text-subtext mt-3">
            Chronotype suggestion: {suggestedHour}:00. This does not change an alarm until you edit it.
          </Text>
          <View className="flex-row mt-3">
            <Pressable onPress={() => setEveningType(v => !v)} className="mr-2 px-3 py-2 rounded-full bg-white border border-primary/30">
              <Text className="text-xs font-bold text-navy">{eveningType ? 'Evening type on' : 'Evening type'}</Text>
            </Pressable>
            <Pressable onPress={() => setLateSleep(v => !v)} className="px-3 py-2 rounded-full bg-white border border-primary/30">
              <Text className="text-xs font-bold text-navy">{lateSleep ? 'Late sleep on' : 'Late sleep'}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={async () => {
              const alarms = useAlarmStore.getState().alarms.map(alarm => ({
                id: alarm.id,
                hour: alarm.hour,
                minute: alarm.minute,
                enabled: alarm.enabled,
              }));
              const path = await NativeAlarm.exportAlarmBackup(JSON.stringify(buildBackupPayload(alarms)));
              toast.showToast({
                title: path ? 'Backup saved' : 'Backup failed',
                message: path ?? 'Could not write the backup file.',
                type: path ? 'success' : 'error',
              });
            }}
            className="mt-4"
          >
            <Text className="text-sm font-bold text-primary">Save alarm backup on this phone</Text>
          </Pressable>
        </View>
      </Section>

      {/* Background & Theme Customization */}
      <Section title="Theme & Wallpaper">
        <View className="p-4">
          <View className="mb-4">
            <Button
              label="Browse Animated Wallpaper Gallery 🎨"
              onPress={() => navigation.navigate('WallpaperGallery')}
            />
            <View className="mt-3">
              <Button
                label="Offline downloads"
                onPress={() => navigation.navigate('OfflineLibrary')}
              />
            </View>
          </View>

          <Text className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Quick Choose App Background
          </Text>

          {/* Wallpaper Preview Grid */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-1 mb-4"
          >
            {BACKGROUND_ITEMS.map(bg => {
              const isSelected = homeBg === bg.id;
              return (
                <Pressable
                  key={bg.id}
                  onPress={() => setBackground('all', bg.id)}
                  className={`mr-3 rounded-2xl overflow-hidden border-2 items-center ${
                    isSelected ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <Image
                    pointerEvents="none"
                    source={wallpaperThumb(bg.id) ?? bg.source}
                    className="w-[70px] h-[110px]"
                    resizeMode="cover"
                  />
                  <View pointerEvents="none" className="w-full bg-slate-900/90 py-1 px-1 items-center">
                    <Text
                      className="text-[10px] font-bold text-white text-center"
                      numberOfLines={1}
                    >
                      {bg.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Wallpaper Brightness */}
          <Text className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Brightness
          </Text>
          <View className="flex-row justify-between mb-4">
            {[
              { label: '40%', val: 0.4 },
              { label: '60%', val: 0.6 },
              { label: '80%', val: 0.8 },
              { label: '100%', val: 1.0 },
            ].map(b => (
              <Pressable
                key={b.val}
                onPress={() => setBrightness(b.val)}
                className={`flex-1 mx-1 py-1.5 rounded-xl items-center border ${
                  Math.abs(brightness - b.val) < 0.1
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    Math.abs(brightness - b.val) < 0.1
                      ? 'text-white'
                      : 'text-slate-700'
                  }`}
                >
                  {b.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Scrim Overlay */}
          <Text className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
            Text Scrim Overlay
          </Text>
          <View className="flex-row justify-between mb-3">
            {[
              { label: 'None', val: 0.0 },
              { label: 'Light', val: 0.15 },
              { label: 'Medium', val: 0.35 },
              { label: 'Dark', val: 0.6 },
            ].map(o => (
              <Pressable
                key={o.val}
                onPress={() => setOverlayOpacity(o.val)}
                className={`flex-1 mx-1 py-1.5 rounded-xl items-center border ${
                  Math.abs(overlayOpacity - o.val) < 0.08
                    ? 'bg-slate-900 border-slate-900'
                    : 'bg-slate-50 border-slate-200/60'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    Math.abs(overlayOpacity - o.val) < 0.08
                      ? 'text-white'
                      : 'text-slate-700'
                  }`}
                >
                  {o.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            label="Reset Theme to Default"
            variant="ghost"
            onPress={resetTheme}
          />
        </View>
      </Section>

      {/* Test Alarm Section */}
      <Section title="Quick Verification">
        <View className="p-4">
          <Text className="text-sm text-slate-600 mb-4 leading-relaxed">
            Schedule a test alarm right now to verify that audio, lock screen,
            and wake-up missions work properly on your device.
          </Text>
          <Button
            label="Test Alarm (with Math Mission)"
            onPress={testAlarmIn5Seconds}
          />

          <View className="mt-3">
            <Button
              label="Replay Onboarding / Tutorial 🚀"
              variant="ghost"
              onPress={() => navigation.navigate('WelcomeWizard')}
            />
          </View>
        </View>
      </Section>

      {/* Permissions & System Reliability */}
      {Platform.OS === 'android' && (
        <Section title="System Reliability">
          <Row>
            <View className="flex-1 pr-3">
              <Text className="text-sm text-slate-800 font-bold">
                Exact Alarm Permission
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {exactAlarmAllowed
                  ? 'Granted ✅ - Alarms trigger at exact seconds'
                  : 'Restricted ❌ - Alarms may be delayed'}
              </Text>
            </View>
            {!exactAlarmAllowed && (
              <Pressable
                onPress={() => NativeAlarm.openExactAlarmSettings()}
                className="bg-primary px-3.5 py-1.5 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-white">Grant</Text>
              </Pressable>
            )}
          </Row>

          <Row>
            <View className="flex-1 pr-3">
              <Text className="text-sm text-slate-800 font-bold">
                Battery Optimization Bypass
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {batteryIgnored
                  ? 'Ignored ✅ - Background killer bypassed'
                  : 'Restricted ⚠️ - App might be killed in sleep'}
              </Text>
            </View>
            {!batteryIgnored && (
              <Pressable
                onPress={() => NativeAlarm.requestIgnoreBatteryOptimizations()}
                className="bg-primary px-3.5 py-1.5 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-white">Disable</Text>
              </Pressable>
            )}
          </Row>

          <Row last>
            <View className="flex-1 pr-3">
              <Text className="text-sm text-slate-800 font-bold">
                🛡️ Prevent Uninstall (Device Admin)
              </Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                {uninstallProtection
                  ? 'Protected 🔒 - Cannot uninstall during ringing alarms'
                  : 'Disabled - App can be uninstalled to skip missions'}
              </Text>
            </View>
            <Switch
              value={uninstallProtection}
              onValueChange={async (on) => {
                if (on) {
                  NativeAlarm.enableUninstallProtection();
                } else {
                  try {
                    await NativeAlarm.disableUninstallProtection();
                    setUninstallProtection(false);
                  } catch (e) {
                    toast.showToast({
                      title: 'Cannot Disable Now',
                      message: 'An alarm is ringing or snoozed. Complete it first!',
                      type: 'error',
                    });
                  }
                }
              }}
              trackColor={{ false: '#E2E8F0', true: '#1652E6' }}
              thumbColor="#FFFFFF"
            />
          </Row>
        </Section>
      )}

      {/* Device Guides */}
      <Section title="OEM Kill Prevention">
        <View className="p-4">
          <Text className="text-sm text-slate-600 leading-relaxed mb-3">
            Manufacturers like Xiaomi (MIUI/HyperOS), Samsung, Infinix, and
            Huawei aggressively kill alarm apps in deep sleep. Make sure
            Auto-Start and Background Activity are allowed.
          </Text>
          <Pressable
            onPress={() => Linking.openURL('https://dontkillmyapp.com')}
            className="flex-row items-center py-1"
          >
            <Text className="text-sm font-bold text-primary">
              Read guide on Don't Kill My App ↗
            </Text>
          </Pressable>
        </View>
      </Section>

      {/* About */}
      <Section title="About">
        <View className="p-4">
          <Text className="text-navy font-black text-base">Alba — Smart Alarm & Sleep</Text>
          <Text className="text-xs text-subtext mt-1">
            Version 1.0.0 • React Native 0.88 + Kotlin Engine
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

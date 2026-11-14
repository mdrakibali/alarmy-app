import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/ui/Button';
import { Row, Section } from '@/components/ui/Section';
import { BACKGROUND_ITEMS } from '@/data/backgrounds';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeStore } from '@/storage/themeStore';
import { useAppInsets } from '@/utils/safeArea';

export function SettingsScreen() {
  const insets = useAppInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(true);
  const [batteryIgnored, setBatteryIgnored] = useState(true);
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
  }, []);

  const checkPermissions = async () => {
    if (Platform.OS === 'android') {
      const exact = await NativeAlarm.canScheduleExactAlarms();
      setExactAlarmAllowed(exact);
      const battery = await NativeAlarm.isIgnoringBatteryOptimizations();
      setBatteryIgnored(battery);
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
      repeatDays: [],
      enabled: true,
      soundId: 'alarm_rooster',
      volume: 1.0,
      vibrate: true,
      snooze: { enabled: true, intervalMin: 3, maxCount: 2 },
      missions: ['math'],
    });

    Alert.alert(
      'Test Alarm Scheduled! ⏳',
      'An alarm has been set for 10-30 seconds from now with a Math Mission. Lock your phone or close the app to test background wakeup!',
      [{ text: 'Got it!' }],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-[#F5F6F8]"
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 10,
        paddingBottom: 140 + insets.bottom,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
        Settings
      </Text>

      {/* Background & Theme Customization */}
      <Section title="Theme & Wallpaper">
        <View className="p-4">
          <Text className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">
            Choose App Background
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
                    isSelected ? 'border-[#FF385C]' : 'border-transparent'
                  }`}
                >
                  <Image
                    source={bg.source}
                    style={{ width: 70, height: 110 }}
                    resizeMode="cover"
                  />
                  <View className="w-full bg-slate-900/90 py-1 px-1 items-center">
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
                    ? 'bg-[#0F172A] border-[#0F172A]'
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
                    ? 'bg-[#0F172A] border-[#0F172A]'
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
                className="bg-[#38BDF8] px-3.5 py-1.5 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-white">Grant</Text>
              </Pressable>
            )}
          </Row>

          <Row last>
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
                className="bg-[#38BDF8] px-3.5 py-1.5 rounded-xl active:opacity-80"
              >
                <Text className="text-xs font-bold text-white">Disable</Text>
              </Pressable>
            )}
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
            <Text className="text-sm font-bold text-[#FF385C]">
              Read guide on Don't Kill My App ↗
            </Text>
          </Pressable>
        </View>
      </Section>

      {/* About */}
      <Section title="About">
        <View className="p-4">
          <Text className="text-slate-900 font-bold">Alarmy Clone</Text>
          <Text className="text-xs text-slate-400 mt-1">
            Version 1.0.0 • React Native 0.88 + Kotlin Engine
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Button } from '@/components/ui/Button';
import { Row, Section } from '@/components/ui/Section';
import { NativeAlarm } from '@/native/AlarmModule';
import { useAlarmStore } from '@/features/alarm/alarmStore';

export function SettingsScreen() {
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(true);
  const [batteryIgnored, setBatteryIgnored] = useState(true);
  const addAlarm = useAlarmStore(s => s.addAlarm);

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

    const testId = addAlarm({
      hour: now.getHours(),
      minute: now.getMinutes(),
      label: 'Test Alarm ⏰',
      repeatDays: [],
      enabled: true,
      soundId: 'default',
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
      className="flex-1 bg-slate-950"
      contentContainerClassName="px-5 pb-12 pt-4"
    >
      <Text className="text-3xl font-bold text-white mb-6">Settings</Text>

      {/* Test Alarm Section */}
      <Section title="Quick Verification">
        <View className="px-4 py-4">
          <Text className="text-sm text-slate-300 mb-3">
            Schedule a test alarm right now to verify that audio, lock screen, and wake-up missions work properly on your device.
          </Text>
          <Button label="Test Alarm (with Math Mission)" onPress={testAlarmIn5Seconds} />
        </View>
      </Section>

      {/* Permissions & System Reliability */}
      {Platform.OS === 'android' && (
        <Section title="System Reliability">
          <Row>
            <View className="flex-1 pr-3">
              <Text className="text-base text-white font-medium">
                Exact Alarm Permission
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {exactAlarmAllowed
                  ? 'Granted ✅ - Alarms trigger at exact seconds'
                  : 'Restricted ❌ - Alarms may be delayed'}
              </Text>
            </View>
            {!exactAlarmAllowed && (
              <Pressable
                onPress={() => NativeAlarm.openExactAlarmSettings()}
                className="bg-amber-500 px-3 py-1.5 rounded-lg active:opacity-80"
              >
                <Text className="text-xs font-bold text-slate-950">Grant</Text>
              </Pressable>
            )}
          </Row>

          <Row last>
            <View className="flex-1 pr-3">
              <Text className="text-base text-white font-medium">
                Battery Optimization Bypass
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5">
                {batteryIgnored
                  ? 'Ignored ✅ - Background killer bypassed'
                  : 'Restricted ⚠️ - App might be killed in sleep'}
              </Text>
            </View>
            {!batteryIgnored && (
              <Pressable
                onPress={() => NativeAlarm.requestIgnoreBatteryOptimizations()}
                className="bg-amber-500 px-3 py-1.5 rounded-lg active:opacity-80"
              >
                <Text className="text-xs font-bold text-slate-950">Disable</Text>
              </Pressable>
            )}
          </Row>
        </Section>
      )}

      {/* Device Guides */}
      <Section title="OEM Kill Prevention">
        <View className="px-4 py-3">
          <Text className="text-sm text-slate-400 leading-relaxed mb-3">
            Manufacturers like Xiaomi (MIUI/HyperOS), Samsung, OnePlus, and Huawei aggressively kill alarm apps in deep sleep. Make sure Auto-Start is ON.
          </Text>
          <Pressable
            onPress={() => Linking.openURL('https://dontkillmyapp.com')}
            className="flex-row items-center py-2"
          >
            <Text className="text-sm font-semibold text-amber-400">
              Read guide on Don't Kill My App ↗
            </Text>
          </Pressable>
        </View>
      </Section>

      {/* About */}
      <Section title="About">
        <View className="px-4 py-3">
          <Text className="text-white font-semibold">Alarmy Clone</Text>
          <Text className="text-xs text-slate-400 mt-1">
            Version 1.0.0 • React Native 0.88 + Kotlin Engine
          </Text>
        </View>
      </Section>
    </ScrollView>
  );
}

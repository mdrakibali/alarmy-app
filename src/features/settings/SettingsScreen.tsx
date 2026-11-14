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

    addAlarm({
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
      className="flex-1 bg-[#F5F6F8]"
      contentContainerClassName="px-5 pb-16 pt-3"
    >
      <Text className="text-3xl font-extrabold text-slate-900 mb-6">
        Settings
      </Text>

      {/* Test Alarm Section */}
      <Section title="Quick Verification">
        <View className="p-4">
          <Text className="text-sm text-slate-600 mb-4 leading-relaxed">
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
            Manufacturers like Xiaomi (MIUI/HyperOS), Samsung, OnePlus, and Huawei aggressively kill alarm apps in deep sleep. Make sure Auto-Start is ON.
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

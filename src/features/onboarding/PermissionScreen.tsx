import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  PermissionsAndroid,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { NativeAlarm } from '@/native/AlarmModule';
import type { RootStackParamList } from '@/navigation/types';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'Permission'>;

export function PermissionScreen({ navigation, route }: Props) {
  const insets = useAppInsets();
  const params = route.params;

  const [hasExactAlarm, setHasExactAlarm] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);
  const [hasBatteryOpt, setHasBatteryOpt] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasActivity, setHasActivity] = useState(false);

  const needsCamera =
    Boolean(params.missions?.some(m => ['photo', 'qr', 'squat'].includes(m))) ||
    ['photo', 'qr', 'squat'].includes(params.mission);
  const needsStep =
    Boolean(params.missions?.includes('step')) || params.mission === 'step';

  const checkAllPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') return;

    try {
      const exact = await NativeAlarm.canScheduleExactAlarms();
      setHasExactAlarm(Boolean(exact));

      if (Platform.Version >= 33) {
        const notif = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        setHasNotification(Boolean(notif));
      } else {
        setHasNotification(true);
      }

      const battery = await NativeAlarm.isIgnoringBatteryOptimizations();
      setHasBatteryOpt(Boolean(battery));

      const overlay = await NativeAlarm.canDrawOverlays();
      setHasOverlay(Boolean(overlay));

      const cam = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
      setHasCamera(Boolean(cam));

      if (Platform.Version >= 29) {
        const act = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        );
        setHasActivity(Boolean(act));
      } else {
        setHasActivity(true);
      }
    } catch (e) {
      console.warn('Error checking permissions:', e);
    }
  }, []);

  useEffect(() => {
    checkAllPermissions();

    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkAllPermissions();
      }
    });

    return () => sub.remove();
  }, [checkAllPermissions]);

  const requestNotificationPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Alarm Notifications',
            message: 'Alba needs notification permission to show alarm ringing banners.',
            buttonPositive: 'Allow',
          },
        );
        setHasNotification(res === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Access',
            message: 'Alba needs camera access for Photo, QR/Barcode, and Squat wake-up missions.',
            buttonPositive: 'Allow',
          },
        );
        setHasCamera(res === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const requestActivityPermission = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 29) {
      try {
        const res = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
          {
            title: 'Physical Activity Tracking',
            message: 'Alba needs motion sensor access to count your morning steps accurately.',
            buttonPositive: 'Allow',
          },
        );
        setHasActivity(res === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleContinue = () => {
    navigation.navigate('AlarmPreview', {
      hour: params.hour,
      minute: params.minute,
      wallpaper: params.wallpaper,
      soundId: params.soundId,
      mission: params.mission,
      missions: params.missions,
      photoReferencePath: params.photoReferencePath,
      barcodeValue: params.barcodeValue,
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Top Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 16) }}
        className="px-6 pb-4 bg-white border-b border-slate-100 shadow-xs"
      >
        <View className="flex-row items-center justify-between mb-2">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            className="py-1 px-2.5 rounded-full bg-slate-100"
          >
            <Text className="text-slate-700 font-extrabold text-xs">‹ Back</Text>
          </TouchableOpacity>
          <View className="bg-ice border border-primary/25 px-3 py-0.5 rounded-full">
            <Text className="text-primary font-black text-[10px] uppercase tracking-wider">
              STEP 5/5 • SECURITY 🛡️
            </Text>
          </View>
        </View>

        <Text className="text-2xl font-black text-slate-900 mt-1">
          Required Permissions
        </Text>
        <Text className="text-xs text-slate-500 font-medium mt-0.5">
          Enable these permissions so Alba wakes you up reliably every time
        </Text>
      </View>

      {/* Permissions List */}
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        {/* 1. Exact Alarm */}
        <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="h-12 w-12 rounded-2xl bg-sky-50 items-center justify-center mr-3 border border-sky-100">
              <Text className="text-2xl">⏰</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                Exact Alarm Schedule
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                Rings at the exact second even when the phone is in deep sleep
              </Text>
            </View>
          </View>

          {hasExactAlarm ? (
            <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
              <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
              <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => NativeAlarm.openExactAlarmSettings()}
              className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
            >
              <Text className="text-white text-xs font-black">Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 2. Notification Permission */}
        <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="h-12 w-12 rounded-2xl bg-amber-50 items-center justify-center mr-3 border border-amber-100">
              <Text className="text-2xl">🔔</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                Alarm Notifications
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                Displays the ringing banner and allows snooze alerts
              </Text>
            </View>
          </View>

          {hasNotification ? (
            <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
              <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
              <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={requestNotificationPermission}
              className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
            >
              <Text className="text-white text-xs font-black">Allow</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 3. Disable Battery Optimization */}
        <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="h-12 w-12 rounded-2xl bg-emerald-50 items-center justify-center mr-3 border border-emerald-100">
              <Text className="text-2xl">🔋</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                Run in Background
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                Prevents Android from killing Alba while you are sleeping
              </Text>
            </View>
          </View>

          {hasBatteryOpt ? (
            <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
              <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
              <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => NativeAlarm.requestIgnoreBatteryOptimizations()}
              className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
            >
              <Text className="text-white text-xs font-black">Allow</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Display Over Other Apps / Lock Screen */}
        <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 pr-3">
            <View className="h-12 w-12 rounded-2xl bg-purple-50 items-center justify-center mr-3 border border-purple-100">
              <Text className="text-2xl">📱</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-slate-900">
                Show Over Lock Screen
              </Text>
              <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                Pops up the alarm screen and missions when phone is locked
              </Text>
            </View>
          </View>

          {hasOverlay ? (
            <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
              <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
              <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => NativeAlarm.openOverlaySettings()}
              className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
            >
              <Text className="text-white text-xs font-black">Enable</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Camera Access (if required by mission) */}
        {needsCamera ? (
          <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View className="h-12 w-12 rounded-2xl bg-rose-50 items-center justify-center mr-3 border border-rose-100">
                <Text className="text-2xl">📸</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">
                  Camera Access
                </Text>
                <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Required for Photo, QR/Barcode, and Squat wake-up missions
                </Text>
              </View>
            </View>

            {hasCamera ? (
              <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
                <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
                <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={requestCameraPermission}
                className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
              >
                <Text className="text-white text-xs font-black">Allow</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* 6. Physical Activity Recognition (if required by step mission) */}
        {needsStep ? (
          <View className="bg-white rounded-3xl p-4 mb-3 border border-slate-100 shadow-xs flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 pr-3">
              <View className="h-12 w-12 rounded-2xl bg-indigo-50 items-center justify-center mr-3 border border-indigo-100">
                <Text className="text-2xl">🚶</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-slate-900">
                  Physical Activity
                </Text>
                <Text className="text-[11px] text-slate-400 font-medium mt-0.5 leading-tight">
                  Required for counting steps to dismiss morning step alarms
                </Text>
              </View>
            </View>

            {hasActivity ? (
              <View className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 flex-row items-center">
                <Text className="text-emerald-600 font-black text-xs mr-1">✓</Text>
                <Text className="text-emerald-700 font-extrabold text-xs">Allowed</Text>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={requestActivityPermission}
                className="px-4 py-2 rounded-xl bg-primary shadow-xs active:bg-primary-dark"
              >
                <Text className="text-white text-xs font-black">Allow</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Tip Box */}
        <View className="bg-ice/70 border border-primary/20 rounded-2xl p-3.5 mt-2 flex-row items-center">
          <Text className="text-xl mr-2.5">💡</Text>
          <Text className="text-xs text-slate-600 font-medium flex-1 leading-relaxed">
            You can enable these permissions now or adjust them later anytime in Settings.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Continue Button */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom + 16, 32) }}
        className="bg-white border-t border-slate-100 shadow-md px-5 pt-3 z-50"
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          className="w-full bg-primary py-4 rounded-2xl items-center shadow-md active:bg-primary-dark"
        >
          <Text className="text-white text-base font-black tracking-wide">
            Continue to Alarm Preview ✨
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


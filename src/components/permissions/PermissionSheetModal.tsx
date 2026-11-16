import React, { useCallback, useEffect, useState } from 'react';
import {
  AppState,
  Modal,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeAlarm } from '@/native/AlarmModule';
import { useAppInsets } from '@/utils/safeArea';

interface Props {
  visible: boolean;
  onClose: () => void;
  requiredPermission?: 'camera' | 'activity' | 'all';
}

export function PermissionSheetModal({
  visible,
  onClose,
  requiredPermission = 'all',
}: Props) {
  const insets = useAppInsets();

  const [hasExactAlarm, setHasExactAlarm] = useState(true);
  const [hasNotification, setHasNotification] = useState(true);
  const [hasBatteryOpt, setHasBatteryOpt] = useState(true);
  const [hasOverlay, setHasOverlay] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [hasActivity, setHasActivity] = useState(true);

  const checkPermissions = useCallback(async () => {
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

      const cam = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
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
    if (visible) {
      checkPermissions();
    }

    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active' && visible) {
        checkPermissions();
      }
    });

    return () => sub.remove();
  }, [visible, checkPermissions]);

  const requestCamera = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Access Needed',
          message:
            'Alba uses the camera to detect squats and scan your barcode to turn off the alarm.',
          buttonPositive: 'Allow',
        },
      );
      setHasCamera(granted === PermissionsAndroid.RESULTS.GRANTED);
      if (requiredPermission === 'camera' && granted === PermissionsAndroid.RESULTS.GRANTED) {
        onClose();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const requestActivity = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 29) return;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
        {
          title: 'Physical Activity Permission',
          message:
            'Alba needs motion sensor access to count your steps and dismiss your morning alarm.',
          buttonPositive: 'Allow',
        },
      );
      setHasActivity(granted === PermissionsAndroid.RESULTS.GRANTED);
      if (requiredPermission === 'activity' && granted === PermissionsAndroid.RESULTS.GRANTED) {
        onClose();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const requestNotification = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Alarm Notifications',
            message:
              'Alba needs notification permission to show ringing banners and countdown alerts.',
            buttonPositive: 'Allow',
          },
        );
        setHasNotification(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          style={{
            maxHeight: '85%',
            paddingBottom: Math.max(insets.bottom + 16, 24),
          }}
          className="bg-white rounded-t-3xl p-6"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View>
              <Text className="text-xl font-black text-slate-900">
                Alarm Permissions
              </Text>
              <Text className="text-xs text-slate-500 font-semibold mt-0.5">
                Required for 100% reliable wake-up
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <Text className="text-slate-500 text-sm font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Camera Permission Card (if camera required or all) */}
            {(requiredPermission === 'camera' || requiredPermission === 'all') && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">📸</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Camera Permission
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Required for Squat, Barcode & Photo missions
                    </Text>
                  </View>
                </View>

                {hasCamera ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={requestCamera}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Step / Physical Activity Permission Card */}
            {(requiredPermission === 'activity' || requiredPermission === 'all') && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">🚶</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Physical Activity
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Needed to count your morning walking steps
                    </Text>
                  </View>
                </View>

                {hasActivity ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={requestActivity}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Exact Alarm Permission */}
            {requiredPermission === 'all' && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">⏰</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Exact Alarms
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Ensures alarms trigger down to the exact second
                    </Text>
                  </View>
                </View>

                {hasExactAlarm ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => NativeAlarm.openExactAlarmSettings()}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Display Over Apps (Overlay) */}
            {requiredPermission === 'all' && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">📱</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Display Over Other Apps
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Pops up alarm directly over your lock screen
                    </Text>
                  </View>
                </View>

                {hasOverlay ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => NativeAlarm.openOverlaySettings()}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Battery Optimization Exemption */}
            {requiredPermission === 'all' && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">🔋</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Battery Optimization
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Prevents phone OS from putting Alba to sleep
                    </Text>
                  </View>
                </View>

                {hasBatteryOpt ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => NativeAlarm.requestIgnoreBatteryOptimizations()}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Notification Permission */}
            {requiredPermission === 'all' && (
              <View className="flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 mb-3 border border-slate-100">
                <View className="flex-row items-center flex-1 mr-3">
                  <Text className="text-2xl mr-3">🔔</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">
                      Notification Access
                    </Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      Displays ringing banners and persistent snooze alerts
                    </Text>
                  </View>
                </View>

                {hasNotification ? (
                  <View className="h-8 px-3 rounded-full bg-emerald-100 items-center justify-center">
                    <Text className="text-emerald-700 text-xs font-black">
                      Granted ✓
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={requestNotification}
                    className="h-8 px-4 rounded-full bg-primary items-center justify-center active:bg-primary-dark"
                  >
                    <Text className="text-white text-xs font-black">Allow</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>

          {/* Done Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            className="w-full bg-primary py-3.5 rounded-2xl items-center mt-3 shadow-md active:bg-primary-dark"
          >
            <Text className="text-white text-sm font-black tracking-wide">
              Done ✓
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

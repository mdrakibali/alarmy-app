import './global.css';
import React, { useEffect, useRef } from 'react';
import {
  Alert,
  AppState,
  Platform,
  StatusBar,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { RootNavigator } from '@/navigation/RootNavigator';
import type { RootStackParamList } from '@/navigation/types';
import { NativeAlarm } from '@/native/AlarmModule';
import { useAlarmStore } from '@/features/alarm/alarmStore';
import { ToastProvider } from '@/components/ui/AppToast';

function App() {
  const navigationRef =
    useRef<NavigationContainerRef<RootStackParamList>>(null);
  const syncFromNative = useAlarmStore(s => s.syncFromNative);

    useEffect(() => {
    // Check if an alarm is already ringing when app opens
    const checkRingingAlarm = async () => {
      const ringing = await NativeAlarm.getCurrentlyRingingAlarm();
      if (ringing && navigationRef.current) {
        const currentRoute = navigationRef.current.getCurrentRoute();
        // Prevent disrupting the user if they are already on AlarmRinging, a Mission, or Snooze
        if (
          currentRoute?.name !== 'AlarmRinging' &&
          !currentRoute?.name?.endsWith('Mission') &&
          currentRoute?.name !== 'SnoozeCountdown'
        ) {
          navigationRef.current.navigate('AlarmRinging', { id: ringing.id });
        }
      }
    };

    checkRingingAlarm();

    // Check if app was cold-started from a snooze notification tap
    const checkInitialSnooze = async () => {
      const initialSnooze = await NativeAlarm.getInitialSnoozeIntent();
      if (initialSnooze?.alarmId && navigationRef.current) {
        navigationRef.current.navigate('SnoozeCountdown', {
          alarmId: initialSnooze.alarmId,
          intervalMin: initialSnooze.intervalMin || 5,
        });
      }
    };

    checkInitialSnooze();

    // Check permissions on Android
    if (Platform.OS === 'android') {
      NativeAlarm.canScheduleExactAlarms().then(canSchedule => {
        if (!canSchedule) {
          Alert.alert(
            'Exact Alarm Permission',
            'To ensure alarms ring at the exact time even when the screen is off, please allow Alarm permission.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Enable',
                onPress: () => NativeAlarm.openExactAlarmSettings(),
              },
            ],
          );
        }
      });
    }

    syncFromNative().finally(() => {
      useAlarmStore.getState().rescheduleAll();
    });

    // Listen to real-time alarm trigger event from background service
    const ringSub = NativeAlarm.onAlarmRinging(alarmId => {
      if (navigationRef.current) {
        const currentRoute = navigationRef.current.getCurrentRoute();
        // Prevent kicking user off screen if already on AlarmRinging or solving a mission
        if (
          currentRoute?.name !== 'AlarmRinging' &&
          !currentRoute?.name?.endsWith('Mission') &&
          currentRoute?.name !== 'SnoozeCountdown'
        ) {
          navigationRef.current.navigate('AlarmRinging', { id: alarmId || undefined });
        }
      }
    });

    // Listen to notification tap when alarm is snoozed
    const snoozeOpenSub = NativeAlarm.onOpenSnooze(data => {
      if (navigationRef.current && data?.alarmId) {
        navigationRef.current.navigate('SnoozeCountdown', {
          alarmId: data.alarmId,
          intervalMin: data.intervalMin || 5,
        });
      }
    });

    // Listen to dismiss action from snooze notification
    const snoozeDismissSub = NativeAlarm.onSnoozeDismissed(alarmId => {
      useAlarmStore.getState().clearSnooze(alarmId);
    });

    // Listen to AppState changes to detect incoming alarm when app is brought to foreground
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkRingingAlarm();

    // Check if app was cold-started from a snooze notification tap
    const checkInitialSnooze = async () => {
      const initialSnooze = await NativeAlarm.getInitialSnoozeIntent();
      if (initialSnooze?.alarmId && navigationRef.current) {
        navigationRef.current.navigate('SnoozeCountdown', {
          alarmId: initialSnooze.alarmId,
          intervalMin: initialSnooze.intervalMin || 5,
        });
      }
    };

    checkInitialSnooze();
      }
    });

    return () => {
      ringSub?.remove();
      snoozeOpenSub?.remove();
      snoozeDismissSub?.remove();
      sub.remove();
    };
  }, [syncFromNative]);

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ToastProvider>
          <StatusBar barStyle="dark-content" />
          <NavigationContainer
            ref={navigationRef}
            theme={{
              ...DefaultTheme,
              colors: {
                ...DefaultTheme.colors,
                background: '#F8FAFC',
                card: '#FFFFFF',
                primary: '#1652E6',
                text: '#08173E',
                border: '#EEF4FF',
              },
            }}
          >
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

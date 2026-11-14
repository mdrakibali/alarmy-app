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
  const rescheduleAll = useAlarmStore(s => s.rescheduleAll);

  useEffect(() => {
    // Check if an alarm is already ringing when app opens
    const checkRingingAlarm = async () => {
      const ringing = await NativeAlarm.getCurrentlyRingingAlarm();
      if (ringing && navigationRef.current) {
        navigationRef.current.navigate('AlarmRinging', { id: ringing.id });
      }
    };

    checkRingingAlarm();

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

    // Sync all enabled alarms to native scheduler
    rescheduleAll();

    // Listen to AppState changes to detect incoming alarm when app is brought to foreground
    const sub = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        checkRingingAlarm();
      }
    });

    return () => {
      sub.remove();
    };
  }, [rescheduleAll]);

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
                background: '#F5F6F8',
                card: '#FFFFFF',
                primary: '#FF385C',
                text: '#0F172A',
                border: '#F1F5F9',
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

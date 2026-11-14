import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppInsets } from '@/utils/safeArea';
import { AlarmEditScreen } from '@/features/alarm/AlarmEditScreen';
import { AlarmListScreen } from '@/features/alarm/AlarmListScreen';
import { AlarmRingingScreen } from '@/features/alarm/AlarmRingingScreen';
import { MathMissionScreen } from '@/features/missions/MathMissionScreen';
import { ShakeMissionScreen } from '@/features/missions/ShakeMissionScreen';
import { MorningScreen } from '@/features/morning/MorningScreen';
import { AlarmPreviewScreen } from '@/features/onboarding/AlarmPreviewScreen';
import { SplashScreen } from '@/features/onboarding/SplashScreen';
import { WelcomeWizardScreen } from '@/features/onboarding/WelcomeWizardScreen';
import { ReportScreen } from '@/features/report/ReportScreen';
import { TabVectorIcon } from '@/components/ui/TabVectorIcon';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { SleepScreen } from '@/features/sleep/SleepScreen';
import { WallpaperGalleryScreen } from '@/features/wallpaper/WallpaperGalleryScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  const insets = useAppInsets();
  const bottomInset = insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F1F5F9',
          borderTopWidth: 1,
          height: 60 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: '#0F172A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="Alarm"
        component={AlarmListScreen}
        options={{
          tabBarLabel: 'Alarm',
          tabBarIcon: ({ focused, color }) => (
            <TabVectorIcon name="alarm" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Sleep"
        component={SleepScreen}
        options={{
          tabBarLabel: 'Sleep',
          tabBarIcon: ({ focused, color }) => (
            <TabVectorIcon name="sleep" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Morning"
        component={MorningScreen}
        options={{
          tabBarLabel: 'Morning',
          tabBarIcon: ({ focused, color }) => (
            <TabVectorIcon name="morning" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ focused, color }) => (
            <TabVectorIcon name="report" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Setting',
          tabBarIcon: ({ focused, color }) => (
            <TabVectorIcon
              name="settings"
              focused={focused}
              color={color}
              hasBadge
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash">
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeWizard"
        component={WelcomeWizardScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlarmPreview"
        component={AlarmPreviewScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlarmEdit"
        component={AlarmEditScreen}
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="AlarmRinging"
        component={AlarmRingingScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="MathMission"
        component={MathMissionScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ShakeMission"
        component={ShakeMissionScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="WallpaperGallery"
        component={WallpaperGalleryScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

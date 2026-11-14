import React from 'react';
import { Text, View } from 'react-native';
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
import { WelcomeWizardScreen } from '@/features/onboarding/WelcomeWizardScreen';
import { ReportScreen } from '@/features/report/ReportScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { SleepScreen } from '@/features/sleep/SleepScreen';
import { WallpaperGalleryScreen } from '@/features/wallpaper/WallpaperGalleryScreen';
import { storage } from '@/storage/mmkv';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabIcon({
  icon,
  focused,
  hasBadge = false,
}: {
  icon: string;
  focused: boolean;
  hasBadge?: boolean;
}) {
  return (
    <View className="items-center justify-center relative">
      <Text
        style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}
      >
        {icon}
      </Text>
      {hasBadge && (
        <View className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-[#FF385C]" />
      )}
    </View>
  );
}

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
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⏰" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Sleep"
        component={SleepScreen}
        options={{
          tabBarLabel: 'Sleep',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🌙" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Morning"
        component={MorningScreen}
        options={{
          tabBarLabel: 'Morning',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="☀️" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{
          tabBarLabel: 'Report',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📊" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Setting',
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⚙️" focused={focused} hasBadge />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const hasCompleted = storage.getBoolean('hasCompletedWelcome');

  return (
    <Stack.Navigator initialRouteName={hasCompleted ? 'Tabs' : 'WelcomeWizard'}>
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

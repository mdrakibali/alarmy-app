import React from 'react';
import { Pressable, Text, View } from 'react-native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlarmEditScreen } from '@/features/alarm/AlarmEditScreen';
import { AlarmListScreen } from '@/features/alarm/AlarmListScreen';
import { AlarmRingingScreen } from '@/features/alarm/AlarmRingingScreen';
import { SnoozeCountdownScreen } from '@/features/alarm/SnoozeCountdownScreen';
import { MathMissionScreen } from '@/features/missions/MathMissionScreen';
import { ShakeMissionScreen } from '@/features/missions/ShakeMissionScreen';
import { BarcodeMissionScreen } from '@/features/missions/BarcodeMissionScreen';
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

function CustomBottomTabBar({
  state,
  descriptors,
  navigation,
  insets,
}: BottomTabBarProps) {
  const bottomInset = insets?.bottom ?? 0;

  return (
    <View
      style={{ paddingBottom: Math.max(bottomInset + 4, 12) }}
      className="flex-row bg-white border-t border-slate-100 pt-2.5 items-center justify-around shadow-sm"
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? '#0F172A' : '#94A3B8';
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = route.name.toLowerCase() as
          | 'alarm'
          | 'sleep'
          | 'morning'
          | 'report'
          | 'settings';

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            className="flex-1 items-center justify-center py-1 active:opacity-75"
          >
            <TabVectorIcon
              name={iconName}
              focused={isFocused}
              color={color}
              hasBadge={route.name === 'Settings'}
            />
            <Text
              className={`text-[11px] font-bold mt-1 ${
                isFocused ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {typeof label === 'string' ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const renderTabBar = (props: BottomTabBarProps) => (
  <CustomBottomTabBar {...props} />
);

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Alarm" component={AlarmListScreen} />
      <Tab.Screen name="Sleep" component={SleepScreen} />
      <Tab.Screen name="Morning" component={MorningScreen} />
      <Tab.Screen name="Report" component={ReportScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
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
        name="SnoozeCountdown"
        component={SnoozeCountdownScreen}
        options={{
          headerShown: false,
          gestureEnabled: false,
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
        name="BarcodeMission"
        component={BarcodeMissionScreen}
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

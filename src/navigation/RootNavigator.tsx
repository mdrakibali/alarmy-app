import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlarmEditScreen } from '@/features/alarm/AlarmEditScreen';
import { AlarmListScreen } from '@/features/alarm/AlarmListScreen';
import { AlarmRingingScreen } from '@/features/alarm/AlarmRingingScreen';
import { MathMissionScreen } from '@/features/missions/MathMissionScreen';
import { ShakeMissionScreen } from '@/features/missions/ShakeMissionScreen';
import { MorningScreen } from '@/features/morning/MorningScreen';
import { SleepScreen } from '@/features/sleep/SleepScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#020617', borderTopColor: '#1e293b' },
        tabBarActiveTintColor: '#f59e0b',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen name="Alarm" component={AlarmListScreen} />
      <Tab.Screen name="Morning" component={MorningScreen} />
      <Tab.Screen name="Sleep" component={SleepScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AlarmEdit"
        component={AlarmEditScreen}
        options={({ route }) => ({
          presentation: 'modal',
          title: route.params?.id ? 'Edit alarm' : 'New alarm',
          headerStyle: { backgroundColor: '#020617' },
          headerTintColor: '#f8fafc',
        })}
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
    </Stack.Navigator>
  );
}

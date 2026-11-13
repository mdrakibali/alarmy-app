import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AlarmEditScreen } from '@/features/alarm/AlarmEditScreen';
import { AlarmListScreen } from '@/features/alarm/AlarmListScreen';
import { PlaceholderScreen } from '@/components/ui/Screen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MorningScreen = () => <PlaceholderScreen title="Morning" />;
const SleepScreen = () => <PlaceholderScreen title="Sleep" />;
const SettingsScreen = () => <PlaceholderScreen title="Settings" />;

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
    </Stack.Navigator>
  );
}

import './global.css';
import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '@/navigation/RootNavigator';

function App() {
  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <NavigationContainer
          theme={{
            ...DarkTheme,
            colors: {
              ...DarkTheme.colors,
              background: '#020617',
              card: '#020617',
              primary: '#f59e0b',
              text: '#f8fafc',
              border: '#1e293b',
            },
          }}
        >
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;

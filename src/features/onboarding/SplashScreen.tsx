import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { storage } from '@/storage/mmkv';
import { useAppInsets } from '@/utils/safeArea';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export function SplashScreen({ navigation }: Props) {
  const insets = useAppInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Smooth entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Transition after 1.4s
    const timer = setTimeout(() => {
      const hasCompleted = storage.getBoolean('hasCompletedWelcome');
      if (hasCompleted) {
        navigation.replace('Tabs');
      } else {
        navigation.replace('WelcomeWizard');
      }
    }, 1400);

    return () => clearTimeout(timer);
  }, [fadeAnim, scaleAnim, navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Center Branding Block */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Glow Behind Logo */}
        <View style={styles.logoGlow} />

        {/* App Logo */}
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* App Title */}
        <Text style={styles.title}>Alarmy</Text>

        {/* Tagline Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Sleep if u can ⏰</Text>
        </View>

        <Text style={styles.subtitle}>
          Smart Wake-Up • Unbeatable Alarms
        </Text>
      </Animated.View>

      {/* Bottom Footer */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) },
        ]}
      >
        <Text style={styles.versionText}>Version 1.0.0 • Light Edition</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#E0E7FF',
    opacity: 0.6,
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF385C',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: '100%',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
});

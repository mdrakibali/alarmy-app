import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook to safely provide bottom and top insets across Android and iOS.
 * On Android devices with 3-button navigation (Infinix, Xiaomi, Samsung, etc.),
 * the navigation bar height is at least 48dp. If insets are too small or 0,
 * system navigation buttons will overlap bottom tab bars and action buttons.
 * This hook guarantees a safe bottom padding of at least 48dp on Android.
 */
export function useAppInsets() {
  const insets = useSafeAreaInsets();

  const bottom =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, 48)
      : Math.max(insets.bottom, 16);

  const top =
    Platform.OS === 'android'
      ? Math.max(insets.top, 24)
      : Math.max(insets.top, 16);

  return {
    ...insets,
    bottom,
    top,
    rawBottom: insets.bottom,
  };
}

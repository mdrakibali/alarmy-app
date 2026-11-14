import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Custom hook to safely provide bottom and top insets across Android and iOS.
 * On Android devices with 3-button navigation (Infinix, Xiaomi, Samsung, etc.),
 * system insets can be 0 if edge-to-edge hasn't dispatched, causing navigation buttons
 * to overlap bottom tab bars and floating action buttons.
 * This hook guarantees a safe bottom padding of at least 48dp on Android if insets.bottom is 0.
 */
export function useAppInsets() {
  const insets = useSafeAreaInsets();

  const bottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 12;

  const top =
    insets.top > 0 ? insets.top : Platform.OS === 'android' ? 24 : 12;

  return {
    ...insets,
    bottom,
    top,
    rawBottom: insets.bottom,
  };
}


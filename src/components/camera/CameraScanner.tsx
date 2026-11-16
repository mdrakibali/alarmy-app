import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleProp,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';

export interface CameraPermissionResult {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraPermission(): CameraPermissionResult {
  const [hasPermission, setHasPermission] = useState(true);

  const requestPermission = async (): Promise<boolean> => {
    setHasPermission(true);
    return true;
  };

  return { hasPermission, requestPermission };
}

export interface CodeScannerProps {
  style?: StyleProp<ViewStyle>;
  isActive?: boolean;
  barcodeFormats?: string[];
  onBarcodeScanned?: (codes: { rawValue: string }[]) => void;
  onError?: (error: any) => void;
}

export function CodeScanner({
  style,
  isActive = true,
  onBarcodeScanned,
}: CodeScannerProps) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 160],
  });

  return (
    <View style={style} className="bg-slate-950 items-center justify-center relative overflow-hidden">
      {/* Target Crosshair */}
      <View className="w-48 h-48 border-2 border-primary/60 rounded-3xl items-center justify-center relative">
        <View className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-xl" />
        <View className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-xl" />
        <View className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-xl" />
        <View className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-xl" />

        {/* Laser Scanning Beam */}
        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="w-40 h-0.5 bg-rose-500 shadow-md"
        />

        <Text className="text-white/60 text-xs font-semibold mt-4 text-center">
          Point camera at QR or Barcode
        </Text>
      </View>

      {/* Quick Test / Trigger Scan Button */}
      {onBarcodeScanned ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            onBarcodeScanned([{ rawValue: '890103038294' }]);
          }}
          className="absolute bottom-2 px-3 py-1 bg-white/20 rounded-full"
        >
          <Text className="text-white text-[10px] font-bold">
            ⚡ Tap to auto-scan test code
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export interface TextRecognitionCameraProps {
  style?: StyleProp<ViewStyle>;
  isActive?: boolean;
  onTextRecognized?: (result: { text?: string }) => void;
  onError?: (error: any) => void;
}

export function TextRecognitionCamera({
  style,
  isActive = true,
  onTextRecognized,
}: TextRecognitionCameraProps) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, scanLineAnim]);

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 160],
  });

  return (
    <View style={style} className="bg-slate-950 items-center justify-center relative overflow-hidden">
      {/* Target Crosshair */}
      <View className="w-56 h-36 border-2 border-emerald-500/60 rounded-3xl items-center justify-center relative">
        <View className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
        <View className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
        <View className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
        <View className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />

        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="w-48 h-0.5 bg-emerald-400 shadow-md"
        />

        <Text className="text-white/60 text-xs font-semibold mt-4 text-center">
          Align text with frame
        </Text>
      </View>

      {onTextRecognized ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            onTextRecognized({ text: '890103038294' });
          }}
          className="absolute bottom-2 px-3 py-1 bg-white/20 rounded-full"
        >
          <Text className="text-white text-[10px] font-bold">
            ⚡ Tap to recognize test text
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

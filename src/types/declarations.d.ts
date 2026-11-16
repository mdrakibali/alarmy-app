declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare module '*.jpeg' {
  const content: any;
  export default content;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module 'react-native-vision-camera' {
  export interface CameraPermissionStatus {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
  }

  export function useCameraPermission(): CameraPermissionStatus;
  export const Camera: any;
}

declare module 'react-native-vision-camera-barcode-scanner' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface ScannedBarcode {
    rawValue?: string;
    [key: string]: any;
  }

  export interface CodeScannerProps {
    style?: StyleProp<ViewStyle>;
    isActive?: boolean;
    barcodeFormats?: string[];
    onBarcodeScanned?: (codes: ScannedBarcode[]) => void;
    onError?: (error: any) => void;
  }

  export const CodeScanner: React.FC<CodeScannerProps>;
}

declare module 'vision-camera-ocr-plugin' {
  import React from 'react';
  import { StyleProp, ViewStyle } from 'react-native';

  export interface OCRResult {
    text?: string;
    [key: string]: any;
  }

  export interface TextRecognitionCameraProps {
    style?: StyleProp<ViewStyle>;
    isActive?: boolean;
    onTextRecognized?: (result: OCRResult) => void;
    onError?: (error: any) => void;
  }

  export const TextRecognitionCamera: React.FC<TextRecognitionCameraProps>;
  export function ocr(...args: any[]): any;
}

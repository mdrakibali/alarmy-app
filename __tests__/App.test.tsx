/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-vision-camera', () => ({
  useCameraPermission: () => ({ hasPermission: true, requestPermission: jest.fn() }),
  Camera: () => null,
}), { virtual: true });

jest.mock('react-native-vision-camera-barcode-scanner', () => ({
  CodeScanner: () => null,
}), { virtual: true });

jest.mock('vision-camera-ocr-plugin', () => ({
  TextRecognitionCamera: () => null,
  ocr: jest.fn(),
}), { virtual: true });

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: {
    createHybridObject: jest.fn(),
  },
}), { virtual: true });

import App from '../App';

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

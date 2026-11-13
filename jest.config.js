module.exports = {
  preset: '@react-native/jest-preset',
  testPathIgnorePatterns: ['<rootDir>/__tests__/mocks/'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__tests__/mocks/styleMock.js',
    '^react-native-mmkv$': '<rootDir>/__tests__/mocks/mmkvMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|react-navigation|@react-navigation/.*|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-reanimated)/',
  ],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js'],
};

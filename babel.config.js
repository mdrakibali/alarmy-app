module.exports = {
  presets: [
    ['module:@react-native/babel-preset', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: { '@': './src' },
      },
    ],
    // must be last
    'react-native-worklets/plugin',
  ],
};

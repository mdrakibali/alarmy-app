/**
 * @format
 */

import { AppRegistry, LogBox } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Disable all LogBox warning overlays in UI so they never obscure buttons
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);

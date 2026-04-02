/**
 * @format
 */

import { AppRegistry } from 'react-native';
import ScreenGuard from 'react-native-screenguard';
import App from './App';
import { name as appName } from './app.json';

// Initialize ScreenGuard globally
ScreenGuard.initSettings();

AppRegistry.registerComponent(appName, () => App);

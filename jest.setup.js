import 'react-native-gesture-handler/jestSetup';
import React from 'react';

jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: (props: any) => props.children,
  Screen: (props: any) => props.children,
  NativeScreen: (props: any) => props.children,
  NativeScreenContainer: (props: any) => props.children,
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => inset,
    SafeAreaConsumer: ({ children }: any) => children(inset),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 0, height: 0 },
      insets: inset,
    },
  };
});

// Mock the whole @react-navigation/native-stack to avoid internal context issues in tests
jest.mock('@react-navigation/native-stack', () => {
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) => children,
      Screen: ({ component: Component }: any) => <Component />,
    }),
  };
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => ({
  Camera: {
    getCameraPermissionStatus: jest.fn(() => 'not-determined'),
    requestCameraPermission: jest.fn(),
  },
  useCameraDevice: jest.fn(),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({ children }: any) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
      setOptions: jest.fn(),
    }),
  };
});

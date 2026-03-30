import React from 'react';
import 'react-native-gesture-handler/jestSetup';

jest.mock('react-native-worklets-core', () => ({
  Worklets: {
    createRunOnJS: (fn: any) => fn,
  },
}));

jest.mock('react-native-worklets', () => ({
  Worklets: {
    createRunOnJS: (fn: any) => fn,
  },
  createSerializable: (val: any) => val,
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const View = (props: any) => React.createElement('View', props);
  const Text = (props: any) => React.createElement('Text', props);
  const Image = (props: any) => React.createElement('Image', props);
  const ScrollView = (props: any) => React.createElement('ScrollView', props);

  const Animated = {
    View,
    Text,
    Image,
    ScrollView,
    createAnimatedComponent: (Component: any) => Component,
    timing: jest.fn(() => ({ start: jest.fn() })),
    spring: jest.fn(() => ({ start: jest.fn() })),
    Value: jest.fn(() => ({ setValue: jest.fn() })),
    event: jest.fn(),
    add: jest.fn(),
    divide: jest.fn(),
    multiply: jest.fn(),
    sub: jest.fn(),
  };

  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (val: any) => ({ value: val }),
    useDerivedValue: (cb: any) => ({
      get value() {
        return cb();
      },
    }),
    useAnimatedStyle: (cb: any) => cb(),
    useAnimatedProps: (cb: any) => cb(),
    withTiming: (val: any) => val,
    withSpring: (val: any) => val,
    withRepeat: (val: any) => val,
    withSequence: (...args: any[]) => args[0],
    runOnJS: (fn: any) => (...args: any[]) => {
      if (typeof fn === 'function') {
        fn(...args);
      }
    },
    runOnUI: (fn: any) => fn,
    makeMutable: (val: any) => ({ value: val }),
    interpolate: (x, y, z) => x,
    createAnimatedComponent: (Component: any) => Component,
    useAnimatedReaction: (prepare: any, react: any) => {
      const val = prepare();
      React.useEffect(() => {
        react(val, undefined);
      }, [JSON.stringify(val)]);
    },
  };
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

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  return {
    Canvas: ({ children }: any) => children,
    Rect: (props: any) => null,
    Circle: (props: any) => null,
    Oval: (props: any) => null,
    Path: (props: any) => null,
    Group: ({ children }: any) => children,
    useCanvasRef: () => ({ current: null }),
  };
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const Camera = React.forwardRef((props, ref) => {
    return React.createElement('View', { ...props, ref, testID: 'camera-view' });
  });

  const getCameraPermissionStatus = jest.fn(() => 'not-determined');
  const requestCameraPermission = jest.fn();

  Camera.getCameraPermissionStatus = getCameraPermissionStatus;
  Camera.requestCameraPermission = requestCameraPermission;

  return {
    Camera,
    useCameraDevice: jest.fn(),
    getCameraPermissionStatus,
    requestCameraPermission,
    useFrameProcessor: jest.fn(),
    VisionCameraProxy: {
      initFrameProcessorPlugin: jest.fn(() => ({
        call: jest.fn(),
      })),
    },
  };
});

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
    useIsFocused: jest.fn(() => true),
  };
});

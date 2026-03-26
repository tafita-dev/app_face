import React from 'react';
import { render } from '@testing-library/react-native';
import { CameraView } from './CameraView';
import { useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFaceDetection } from './hooks/useFaceDetection';

// Mock react-native core components and modules
jest.mock('react-native', () => {
  const React = require('react');

  const mockStyleSheet = {
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => style),
  };

  const mockAppState = {
    currentState: 'active',
    addEventListener: jest.fn((event, callback) => {
      if (event === 'change') {
        callback('active');
      }
      return { remove: jest.fn() };
    }),
  };

  const MockView = jest.fn(({ style, ...props }) => React.createElement('View', { ...props, style }));
  const MockText = jest.fn(({ style, ...props }) => React.createElement('Text', { ...props, style }));

  return {
    StyleSheet: mockStyleSheet,
    AppState: mockAppState,
    View: MockView,
    Text: MockText,
    useWindowDimensions: jest.fn(() => ({ width: 400, height: 800 })),
  };
});

// Mock react-native-vision-camera
jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  const MockCamera = jest.fn(({ testID, ...props }) => React.createElement('View', { ...props, testID }));
  return {
    useCameraDevice: jest.fn(),
    Camera: MockCamera,
    getCameraPermissionStatus: jest.fn(() => 'not-determined'),
    requestCameraPermission: jest.fn(),
  };
});

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useIsFocused: jest.fn(),
}));

// Mock useFaceDetection hook
jest.mock('./hooks/useFaceDetection', () => ({
  useFaceDetection: jest.fn(),
}));

// Mock FaceGuide component
jest.mock('../../components/camera/FaceGuide', () => ({
  FaceGuide: jest.fn(({ testID = 'face-guide' }) => {
    const React = require('react');
    return React.createElement('View', { testID });
  }),
}));

describe('CameraView', () => {
  const mockDevice = {
    id: 'front-camera',
    position: 'front',
    hasFlash: true,
  } as any;

  const mockFaceDetection = {
    frameProcessor: jest.fn(),
    face: { value: null },
    frameDimensions: { value: { width: 0, height: 0 } },
    validPosition: { value: false },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useCameraDevice as jest.Mock).mockReturnValue(mockDevice);
    (useIsFocused as jest.Mock).mockReturnValue(true);
    (useFaceDetection as jest.Mock).mockReturnValue(mockFaceDetection);
  });

  it('renders the camera component when device is available', () => {
    const { getByTestId } = render(<CameraView />);
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('renders the FaceGuide overlay', () => {
    const { getByTestId } = render(<CameraView />);
    expect(getByTestId('face-guide')).toBeTruthy();
  });

  it('selects the front camera by default', () => {
    render(<CameraView />);
    expect(useCameraDevice).toHaveBeenCalledWith('front');
  });

  it('sets camera to active when focused and in foreground', () => {
    const { getByTestId } = render(<CameraView />);
    const camera = getByTestId('camera-view');
    expect(camera.props.isActive).toBe(true);
  });

  it('sets camera to inactive when screen is not focused', () => {
    (useIsFocused as jest.Mock).mockReturnValue(false);
    const { getByTestId } = render(<CameraView />);
    const camera = getByTestId('camera-view');
    expect(camera.props.isActive).toBe(false);
  });

  it('renders nothing when no camera device is found', () => {
    (useCameraDevice as jest.Mock).mockReturnValue(undefined);
    const { queryByTestId } = render(<CameraView />);
    expect(queryByTestId('camera-view')).toBeNull();
  });
});

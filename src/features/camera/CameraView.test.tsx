import React from 'react';
import { render } from '@testing-library/react-native';
import { CameraView } from './CameraView';
import { useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';

// Mock react-native core components and modules
jest.mock('react-native', () => {
  const React = require('react'); // Import React inside the factory

  // Mock StyleSheet
  const mockStyleSheet = {
    absoluteFill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
    create: jest.fn(styles => styles),
    flatten: jest.fn(style => style),
  };

  // Mock AppState
  const mockAppState = {
    currentState: 'active',
    addEventListener: jest.fn((event, callback) => {
      if (event === 'change') {
        callback('active');
      }
      return { remove: jest.fn() };
    }),
  };

  // Mock View and Text components using React.createElement
  const MockView = jest.fn(({ style, ...props }) => React.createElement('View', { ...props, style }));
  const MockText = jest.fn(({ style, ...props }) => React.createElement('Text', { ...props, style }));

  return {
    StyleSheet: mockStyleSheet,
    AppState: mockAppState,
    View: MockView,
    Text: MockText,
    // Other modules as needed
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
  // Add other Navigation mocks if needed by the tests
}));

describe('CameraView', () => {
  const mockDevice = {
    id: 'front-camera',
    position: 'front',
    hasFlash: true,
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    (useCameraDevice as jest.Mock).mockReturnValue(mockDevice);
    (useIsFocused as jest.Mock).mockReturnValue(true);
  });

  it('renders the camera component when device is available', () => {
    const { getByTestId } = render(<CameraView />);
    expect(getByTestId('camera-view')).toBeTruthy();
  });

  it('selects the front camera by default', () => {
    render(<CameraView />);
    expect(useCameraDevice).toHaveBeenCalledWith('front');
  });

  it('sets camera to active when focused and in foreground', () => {
    const { getByTestId } = render(<CameraView />);
    const camera = getByTestId('camera-view'); // This should refer to the mocked View component
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

  it('is styled to fill the absolute parent', () => {
    const { getByTestId } = render(<CameraView />);
    const camera = getByTestId('camera-view');
    expect(camera.props.style).toEqual(expect.objectContaining({
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    }));
  });
});

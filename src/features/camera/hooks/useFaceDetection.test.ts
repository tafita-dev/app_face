import { renderHook } from '@testing-library/react-native';
import { useFaceDetection } from './useFaceDetection';
import { useFrameProcessor } from 'react-native-vision-camera';
import { scanFaces } from '../frame-processors/face-processor';

jest.mock('react-native-vision-camera', () => {
  const React = require('react');
  return {
    Camera: React.forwardRef((props: any, ref: any) => {
      return React.createElement('View', { ...props, ref, testID: 'camera-view' });
    }),
    useCameraDevice: jest.fn(),
    getCameraPermissionStatus: jest.fn(() => 'not-determined'),
    requestCameraPermission: jest.fn(),
    useFrameProcessor: jest.fn((cb) => cb),
  };
});

jest.mock('../frame-processors/face-processor', () => ({
  scanFaces: jest.fn(),
}));

describe('useFaceDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize shared values and frame processor', () => {
    const { result } = renderHook(() => useFaceDetection());

    expect(useFrameProcessor).toHaveBeenCalled();
    expect(result.current.face).toBeDefined();
    expect(result.current.validPosition).toBeDefined();
  });

  it('should update face with the largest detected face', () => {
    const mockScanFaces = scanFaces as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100 } as any;
    mockScanFaces.mockReturnValue([
      { bounds: { top: 0, left: 0, width: 10, height: 10 } },
      { bounds: { top: 0, left: 0, width: 20, height: 20 } },
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.face.value).toEqual({
      bounds: { top: 0, left: 0, width: 20, height: 20 },
    });
  });

  it('should calculate validPosition correctly when face is centered', () => {
    const mockScanFaces = scanFaces as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100 } as any;
    mockScanFaces.mockReturnValue([
      { bounds: { top: 40, left: 40, width: 20, height: 20 } }, // center is (50, 50)
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.validPosition.value).toBe(true);
  });

  it('should calculate validPosition correctly when face is off center', () => {
    const mockScanFaces = scanFaces as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100 } as any;
    mockScanFaces.mockReturnValue([
      { bounds: { top: 0, left: 0, width: 20, height: 20 } }, // center is (10, 10)
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.validPosition.value).toBe(false);
  });
});

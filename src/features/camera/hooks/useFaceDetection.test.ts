import { renderHook } from '@testing-library/react-native';
import { useFaceDetection } from './useFaceDetection';
import { useFrameProcessor } from 'react-native-vision-camera';
import { trackFacialLandmarks } from '../frame-processors/face-processor';

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
  trackFacialLandmarks: jest.fn(),
}));

jest.mock('../../verification/deepfake/hooks/useTemporalConsistency', () => ({
  useTemporalConsistency: jest.fn(() => ({
    analyzeFrame: jest.fn().mockReturnValue(1.0),
  })),
}));

// Simple Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn((val: any) => ({ value: val })),
    useDerivedValue: jest.fn((cb: any) => ({
      get value() {
        return cb();
      },
    })),
    runOnJS: (fn: any) => fn,
  };
});

describe('useFaceDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize shared values and frame processor', () => {
    const { result } = renderHook(() => useFaceDetection());

    expect(useFrameProcessor).toHaveBeenCalled();
    expect(result.current.face).toBeDefined();
    expect(result.current.validPosition).toBeDefined();
    expect(result.current.frameDimensions).toBeDefined();
  });

  it('should update face with the largest detected face', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    mockTrackFacialLandmarks.mockReturnValue([
      { bounds: { top: 0, left: 0, width: 10, height: 10 }, landmarks: {}, yawAngle: 0 },
      { bounds: { top: 0, left: 0, width: 20, height: 20 }, landmarks: {}, yawAngle: 0 },
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.face.value).toEqual({
      bounds: { top: 0, left: 0, width: 20, height: 20 },
      landmarks: {},
      yawAngle: 0,
    });
  });

  it('should update frameDimensions in frame processor', () => {
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 1920, height: 1080, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    frameProcessorCallback(mockFrame);

    expect(result.current.frameDimensions.value).toEqual({ width: 1920, height: 1080 });
  });

  it('should calculate validPosition correctly when face is centered', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    mockTrackFacialLandmarks.mockReturnValue([
      { bounds: { top: 40, left: 40, width: 20, height: 20 }, landmarks: {}, yawAngle: 0 }, // center is (50, 50)
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.validPosition.value).toBe(true);
  });

  it('should calculate validPosition correctly when face is off center', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    mockTrackFacialLandmarks.mockReturnValue([
      { bounds: { top: 0, left: 0, width: 20, height: 20 }, landmarks: {}, yawAngle: 0 }, // center is (10, 10)
    ]);

    frameProcessorCallback(mockFrame);

    expect(result.current.validPosition.value).toBe(false);
  });

  it('should set face to null when no faces are detected', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    mockTrackFacialLandmarks.mockReturnValue(null);

    frameProcessorCallback(mockFrame);

    expect(result.current.face.value).toBeNull();
  });

  it('should update deepfake score every 10 frames if model is provided', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const mockModel = { run: jest.fn().mockReturnValue([[0.85]]) };
    const { result } = renderHook(() => useFaceDetection(mockModel as any));
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = {
      width: 100,
      height: 100,
      toArrayBuffer: jest.fn(() => new ArrayBuffer(100 * 100 * 4)),
    } as any;
    mockTrackFacialLandmarks.mockReturnValue([{ 
      bounds: { top: 0, left: 0, width: 20, height: 20 },
      landmarks: { leftEye: { x: 5, y: 5 }, rightEye: { x: 15, y: 5 } },
      yawAngle: 0
    }]);

    // Run for 9 frames
    for (let i = 0; i < 9; i++) {
      frameProcessorCallback(mockFrame);
    }
    expect(mockModel.run).not.toHaveBeenCalled();

    // 10th frame
    frameProcessorCallback(mockFrame);
    expect(mockModel.run).toHaveBeenCalled();
    // (0.85 + (1 - 1.0)) / 2 = 0.425
    expect(result.current.face.value.deepfakeScore).toBe(0.425);
  });
});

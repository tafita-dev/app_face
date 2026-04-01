import { renderHook } from '@testing-library/react-native';
import { useFaceDetection } from './useFaceDetection';
import { useFrameProcessor } from 'react-native-vision-camera';
import { trackFacialLandmarks } from '../frame-processors/face-processor';
import { estimateAmbientLight } from '../frame-processors/image-utils';
import { adaptiveSecurityService } from '../../security/adaptive-security-service';

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

jest.mock('../frame-processors/image-utils', () => ({
  cropFace: jest.fn(),
  extractTemporalFeatures: jest.fn(() => ({ highlights: 0, edgeVariance: 0 })),
  estimateAmbientLight: jest.fn(() => ({ averageIntensity: 100, isLowLight: false })),
}));

jest.mock('../../verification/deepfake/hooks/useTemporalConsistency', () => ({
  useTemporalConsistency: jest.fn(() => ({
    analyzeFrame: jest.fn().mockReturnValue(1.0),
  })),
}));

jest.mock('../../security/adaptive-security-service', () => ({
  adaptiveSecurityService: {
    setIsLowLight: jest.fn(),
  },
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
      textureAnalysis: {
        pixelVariation: 0,
        moirePatternDetected: false,
        highFrequencyScore: 0,
        isLowLight: false,
      },
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

  it('should set isLowLight to true when estimateAmbientLight returns isLowLight: true', () => {
    const mockTrackFacialLandmarks = trackFacialLandmarks as jest.Mock;
    const mockEstimateAmbientLight = estimateAmbientLight as jest.Mock;
    const { result } = renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    mockTrackFacialLandmarks.mockReturnValue([
      { bounds: { top: 0, left: 0, width: 20, height: 20 }, landmarks: {}, yawAngle: 0 },
    ]);
    mockEstimateAmbientLight.mockReturnValue({ averageIntensity: 20, isLowLight: true });

    frameProcessorCallback(mockFrame);

    expect(result.current.face.value.textureAnalysis.isLowLight).toBe(true);
    expect(result.current.isLowLight.value).toBe(true);
  });

  it('should call adaptiveSecurityService.setIsLowLight when isLowLight changes', () => {
    const mockEstimateAmbientLight = estimateAmbientLight as jest.Mock;
    renderHook(() => useFaceDetection());
    const frameProcessorCallback = (useFrameProcessor as jest.Mock).mock.calls[0][0];

    const mockFrame = { width: 100, height: 100, toArrayBuffer: () => new ArrayBuffer(0) } as any;
    
    // First frame: low light
    mockEstimateAmbientLight.mockReturnValue({ averageIntensity: 20, isLowLight: true });
    frameProcessorCallback(mockFrame);
    expect(adaptiveSecurityService.setIsLowLight).toHaveBeenCalledWith(true);

    // Second frame: still low light, should NOT call again
    jest.clearAllMocks();
    frameProcessorCallback(mockFrame);
    expect(adaptiveSecurityService.setIsLowLight).not.toHaveBeenCalled();

    // Third frame: optimal light, SHOULD call with false
    mockEstimateAmbientLight.mockReturnValue({ averageIntensity: 100, isLowLight: false });
    frameProcessorCallback(mockFrame);
    expect(adaptiveSecurityService.setIsLowLight).toHaveBeenCalledWith(false);
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
    // (0.85 * 0.7) + (1 - 1.0) * 0.3 = 0.595
    expect(result.current.face.value.deepfakeScore).toBeCloseTo(0.595);
  });
});

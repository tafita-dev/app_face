import { Frame } from 'react-native-vision-camera';
import { trackFacialLandmarks, plugin } from './face-processor';

// Mock VisionCameraProxy and Frame
jest.mock('react-native-vision-camera', () => ({
  VisionCameraProxy: {
    initFrameProcessorPlugin: jest.fn(() => ({
      call: jest.fn(),
    })),
  },
  Frame: jest.fn(),
}));

describe('Face Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return null when no face is detected', () => {
    (plugin!.call as jest.Mock).mockReturnValue([]);
    const mockFrame = { width: 1920, height: 1080 } as unknown as Frame;
    
    const result = trackFacialLandmarks(mockFrame);
    
    expect(result).toBeNull();
  });

  test('should return face detection result when a face is detected', () => {
    const mockFace = {
      bounds: { top: 100, left: 100, width: 200, height: 200 },
      landmarks: {
        leftEye: { x: 150, y: 150 },
        rightEye: { x: 250, y: 150 },
      },
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    };
    (plugin!.call as jest.Mock).mockReturnValue([mockFace]);
    const mockFrame = { width: 1920, height: 1080 } as unknown as Frame;

    const result = trackFacialLandmarks(mockFrame);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual(mockFace);
  });

  test('should handle multiple faces and return them all', () => {
     const mockFaces = [
      {
        bounds: { top: 100, left: 100, width: 200, height: 200 },
        landmarks: {},
        rollAngle: 0,
        pitchAngle: 0,
        yawAngle: 0,
      },
      {
        bounds: { top: 400, left: 400, width: 150, height: 150 },
        landmarks: {},
        rollAngle: 0,
        pitchAngle: 0,
        yawAngle: 0,
      }
    ];
    (plugin!.call as jest.Mock).mockReturnValue(mockFaces);
    const mockFrame = { width: 1920, height: 1080 } as unknown as Frame;

    const result = trackFacialLandmarks(mockFrame);

    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result).toEqual(mockFaces);
  });
});

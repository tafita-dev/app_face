import { Frame } from 'react-native-vision-camera';

// Define mock structures that mimic MLKit's output for testing
export interface MockMLKitLandmark {
  x: number;
  y: number;
}

export interface MockMLKitFace {
  frame: {
    width: number;
    height: number;
    top: number;
    left: number;
    right: number;
    bottom: number;
  };
  landmarks: {
    leftEye?: MockMLKitLandmark[];
    rightEye?: MockMLKitLandmark[];
    noseBase?: MockMLKitLandmark[];
    mouthBottom?: MockMLKitLandmark[];
    mouthLeft?: MockMLKitLandmark[];
    mouthRight?: MockMLKitLandmark[];
    // ... other landmarks if needed
  };
  angles: {
    roll: number;
    pitch: number;
    yaw: number;
  };
  livenessScore?: number; // Placeholder for potential liveness score from MLKit
}

export interface MockMLKitFaceDetectionResult {
  faces: MockMLKitFace[];
}

// Mock implementation of detectFaces function
export const detectFaces = jest.fn((frame: Frame): MockMLKitFaceDetectionResult => {
  // Default mock behavior: return a single face detection
  // This will be overridden in tests where specific return values are needed.
  const defaultWidth = frame.width || 1920;
  const defaultHeight = frame.height || 1080;

  // Provide a default face detection result that can be overridden by test mocks
  return {
    faces: [
      {
        frame: {
          width: defaultWidth,
          height: defaultHeight,
          top: defaultHeight * 0.1,
          left: defaultWidth * 0.2,
          right: defaultWidth * 0.8,
          bottom: defaultHeight * 0.8,
        },
        landmarks: {
          leftEye: [{ x: defaultWidth * 0.4, y: defaultHeight * 0.3 }],
          rightEye: [{ x: defaultWidth * 0.6, y: defaultHeight * 0.3 }],
          noseBase: [{ x: defaultWidth * 0.5, y: defaultHeight * 0.4 }],
          mouthBottom: [{ x: defaultWidth * 0.5, y: defaultHeight * 0.5 }],
          mouthLeft: [{ x: defaultWidth * 0.45, y: defaultHeight * 0.5 }],
          mouthRight: [{ x: defaultWidth * 0.55, y: defaultHeight * 0.5 }],
        },
        angles: { roll: 0, pitch: 0, yaw: 0 },
        livenessScore: 0.9, // Default liveness score
      },
    ],
  };
});

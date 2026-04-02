export interface IFaceLandmark {
  x: number;
  y: number;
}

export interface IFaceDetection {
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye?: IFaceLandmark;
    rightEye?: IFaceLandmark;
    noseBase?: IFaceLandmark;
    mouthBottom?: IFaceLandmark;
    mouthLeft?: IFaceLandmark;
    mouthRight?: IFaceLandmark;
    // ... add other MLKit landmarks as needed
  };
  contours?: Record<string, IFaceLandmark[]>;
  rollAngle: number;
  pitchAngle: number;
  yawAngle: number;
  smilingProbability?: number;
  livenessScore?: number;
  deepfakeScore?: number;
  textureAnalysis?: {
    pixelVariation: number;
    moirePatternDetected: boolean;
    highFrequencyScore: number;
    frequencyArtifacts?: number;
    isLowLight?: boolean;
  };
  embedding?: Float32Array;
}

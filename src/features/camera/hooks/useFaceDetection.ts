import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { trackFacialLandmarks } from '../frame-processors/face-processor';
import { IFaceDetection } from '../frame-processors/types';
import { TensorflowModel } from 'react-native-fast-tflite';
import { cropFace, extractTemporalFeatures } from '../frame-processors/image-utils';
import { useTemporalConsistency } from '../../verification/deepfake/hooks/useTemporalConsistency';

export const useFaceDetection = (antiDeepfakeModel?: TensorflowModel | null) => {
  const face = useSharedValue<IFaceDetection | null>(null);
  const frameDimensions = useSharedValue({ width: 0, height: 0 });
  const frameCount = useSharedValue(0);
  const { analyzeFrame } = useTemporalConsistency();

  const validPosition = useDerivedValue(() => {
    if (!face.value) return false;

    const { bounds } = face.value;
    const { width: frameWidth, height: frameHeight } = frameDimensions.value;

    if (frameWidth === 0 || frameHeight === 0) return false;

    const faceCenterX = bounds.left + bounds.width / 2;
    const faceCenterY = bounds.top + bounds.height / 2;

    const centerX = frameWidth / 2;
    const centerY = frameHeight / 2;

    const toleranceX = frameWidth * 0.2;
    const toleranceY = frameHeight * 0.2;

    return (
      Math.abs(faceCenterX - centerX) < toleranceX &&
      Math.abs(faceCenterY - centerY) < toleranceY
    );
  });

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      frameDimensions.value = { width: frame.width, height: frame.height };
      frameCount.value += 1;

      const detectedFaces = trackFacialLandmarks(frame);
      if (detectedFaces && detectedFaces.length > 0) {
        // Prioritize the largest face
        let largestFace = detectedFaces[0];
        for (let i = 1; i < detectedFaces.length; i++) {
          const area =
            detectedFaces[i].bounds.width * detectedFaces[i].bounds.height;
          const largestArea =
            largestFace.bounds.width * largestFace.bounds.height;
          if (area > largestArea) {
            largestFace = detectedFaces[i];
          }
        }

        // Perform Temporal Consistency Analysis every frame
        const { highlights, edgeVariance } = extractTemporalFeatures(
          frame,
          largestFace.landmarks,
          largestFace.bounds,
        );
        const temporalScore = analyzeFrame(largestFace.yawAngle, highlights, edgeVariance);

        // Run deepfake analysis every 10 frames if the model is available
        if (antiDeepfakeModel != null && frameCount.value % 10 === 0) {
          try {
            // Scenario 1: Actual JSI-optimized cropping and resizing
            // Applying 15% padding as per technical notes
            const { bounds } = largestFace;
            const paddingX = bounds.width * 0.15;
            const paddingY = bounds.height * 0.15;
            const paddedBounds = {
              left: bounds.left - paddingX,
              top: bounds.top - paddingY,
              width: bounds.width + paddingX * 2,
              height: bounds.height + paddingY * 2,
            };

            const croppedFace = cropFace(frame, paddedBounds, 224);
            
            // Scenario 2: Call model.run() with actual cropped data
            const results = antiDeepfakeModel.run([croppedFace]);
            
            if (results && results.length > 0) {
              let score = results[0][0] as number;

              // Correlate with Temporal Score: temporalScore is consistency (0-1)
              // We want to INCREASE the deepfake probability if consistency is LOW.
              // So deepfakeScore = (score + (1 - temporalScore)) / 2
              score = (score + (1 - temporalScore)) / 2;

              largestFace.deepfakeScore = score;
              if (largestFace.textureAnalysis == null) {
                largestFace.textureAnalysis = {
                  pixelVariation: 0,
                  moirePatternDetected: false,
                  highFrequencyScore: 0,
                  frequencyArtifacts: score,
                };
              } else {
                largestFace.textureAnalysis.frequencyArtifacts = score;
              }
            }
          } catch (e) {
            console.error('Deepfake analysis error:', e);
          }
        } else if (face.value) {
          // Carry over previous score to avoid flickering if face is same
          largestFace.deepfakeScore = face.value.deepfakeScore;
          largestFace.textureAnalysis = face.value.textureAnalysis;
        }

        face.value = largestFace;
      } else {
        face.value = null;
      }
    },
    [antiDeepfakeModel, analyzeFrame],
  );

  return { face, validPosition, frameProcessor, frameDimensions };
};

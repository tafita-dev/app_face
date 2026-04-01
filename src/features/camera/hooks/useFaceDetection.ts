import { useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { trackFacialLandmarks } from '../frame-processors/face-processor';
import { IFaceDetection } from '../frame-processors/types';
import { TensorflowModel } from 'react-native-fast-tflite';
import { cropFace, extractTemporalFeatures, estimateAmbientLight } from '../frame-processors/image-utils';
import { useTemporalConsistency } from '../../verification/deepfake/hooks/useTemporalConsistency';
import { DeepfakeService } from '../../verification/deepfake/DeepfakeService';
import { adaptiveSecurityService } from '../../security/adaptive-security-service';

export const useFaceDetection = (
  antiDeepfakeModel?: TensorflowModel | null,
  biometricModel?: TensorflowModel | null,
) => {
  const face = useSharedValue<IFaceDetection | null>(null);
  const isLowLight = useSharedValue(false);
  const previousIsLowLight = useSharedValue(false);
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

  const updateLowLightStatus = (val: boolean) => {
    adaptiveSecurityService.setIsLowLight(val);
  };

  const frameProcessor = useFrameProcessor(
    frame => {
      'worklet';
      frameDimensions.value = { width: frame.width, height: frame.height };
      frameCount.value += 1;

      const { isLowLight: currentIsLowLight } = estimateAmbientLight(frame);
      isLowLight.value = currentIsLowLight;

      if (currentIsLowLight !== previousIsLowLight.value) {
        previousIsLowLight.value = currentIsLowLight;
        runOnJS(updateLowLightStatus)(currentIsLowLight);
      }

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

        // Initialize textureAnalysis if not exists
        if (largestFace.textureAnalysis == null) {
          largestFace.textureAnalysis = {
            pixelVariation: 0,
            moirePatternDetected: false,
            highFrequencyScore: 0,
            isLowLight: currentIsLowLight,
          };
        } else {
          largestFace.textureAnalysis.isLowLight = currentIsLowLight;
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
              const ganScore = results[0][0] as number;

              // Use DeepfakeService for weighted aggregation
              const score = DeepfakeService.calculateScore({
                ganScore,
                temporalConsistency: temporalScore,
              });

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

        // Run biometric embedding extraction every 20 frames if the model is available
        if (biometricModel != null && frameCount.value % 20 === 0) {
          try {
            // MobileFaceNet usually expects 112x112 input
            const croppedFace = cropFace(frame, largestFace.bounds, 112);
            
            const results = biometricModel.run([croppedFace]);
            
            if (results && results.length > 0) {
              const rawEmbedding = results[0] as unknown as Float32Array;
              
              // L2 Normalization in worklet
              let sum = 0;
              for (let i = 0; i < rawEmbedding.length; i++) {
                sum += rawEmbedding[i] * rawEmbedding[i];
              }
              const magnitude = Math.sqrt(sum);
              if (magnitude > 0) {
                const normalizedEmbedding = new Float32Array(rawEmbedding.length);
                for (let i = 0; i < rawEmbedding.length; i++) {
                  normalizedEmbedding[i] = rawEmbedding[i] / magnitude;
                }
                largestFace.embedding = normalizedEmbedding;
              }
            }
          } catch (e) {
            console.error('Biometric extraction error:', e);
          }
        } else if (face.value) {
          // Carry over previous embedding
          largestFace.embedding = face.value.embedding;
        }

        face.value = largestFace;
      } else {
        face.value = null;
      }
    },
    [antiDeepfakeModel, biometricModel, analyzeFrame],
  );

  return { face, isLowLight, validPosition, frameProcessor, frameDimensions };
};

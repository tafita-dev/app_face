import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { trackFacialLandmarks } from '../frame-processors/face-processor';
import { IFaceDetection } from '../frame-processors/types';

export const useFaceDetection = () => {
  const face = useSharedValue<IFaceDetection | null>(null);
  const frameDimensions = useSharedValue({ width: 0, height: 0 });

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

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    frameDimensions.value = { width: frame.width, height: frame.height };
    
    const detectedFaces = trackFacialLandmarks(frame);
    if (detectedFaces && detectedFaces.length > 0) {
      // Prioritize the largest face
      let largestFace = detectedFaces[0];
      for (let i = 1; i < detectedFaces.length; i++) {
        const area = detectedFaces[i].bounds.width * detectedFaces[i].bounds.height;
        const largestArea = largestFace.bounds.width * largestFace.bounds.height;
        if (area > largestArea) {
          largestFace = detectedFaces[i];
        }
      }
      face.value = largestFace;
    } else {
      face.value = null;
    }
  }, []);

  return { face, validPosition, frameProcessor };
};

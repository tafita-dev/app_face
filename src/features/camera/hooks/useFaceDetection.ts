import { useSharedValue, useDerivedValue } from 'react-native-reanimated';
import { useFrameProcessor } from 'react-native-vision-camera';
import { scanFaces } from '../frame-processors/face-processor';
import { IFaceDetection } from '../frame-processors/types';

export const useFaceDetection = () => {
  const face = useSharedValue<IFaceDetection | null>(null);
  const frameDimensions = useSharedValue({ width: 0, height: 0 });

  const validPosition = useDerivedValue(() => {
    if (!face.value) return false;

    // Map camera coordinates to a normalized screen coordinate system (0-1)
    // or keep them in absolute terms. For guidance logic, 
    // we need to know the face's position relative to the screen.
    const { bounds } = face.value;
    const { width: frameWidth, height: frameHeight } = frameDimensions.value;

    if (frameWidth === 0 || frameHeight === 0) return false;

    // As per Architecture, bounds are in native camera coordinate system.
    // We assume the camera view fills the screen. 
    // If the camera is not full screen, or aspect ratio differs,
    // we would need a more complex projection matrix.
    // For now, center based on detected frame bounds.
    
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
    
    const detectedFaces = scanFaces(frame);
    if (detectedFaces.length > 0) {
      // Prioritize the largest face
      let largestFace = detectedFaces[0];
      for (let i = 1; i < detectedFaces.length; i++) {
        const area = detectedFaces[i].bounds.width * detectedFaces[i].bounds.height;
        const largestArea = largestFace.bounds.width * largestFace.bounds.height;
        if (area > largestArea) {
          largestFace = detectedFaces[i];
        }
      }

      // Ensure data returned from plugin is in camera's native coordinate system.
      // If we need to map to screen for visualization later (US-02-FACE-003),
      // we can do it using frame dimensions here, or in the UI layer.
      // Based on US-02-FACE-001 requirements, we just need to provide face detection
      // and basic validPosition flag.
      face.value = largestFace;
    } else {
      face.value = null;
    }
  }, []);

  return { face, validPosition, frameProcessor };
};

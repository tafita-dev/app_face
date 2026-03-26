import { useDerivedValue, SharedValue } from 'react-native-reanimated';
import { IFaceDetection } from '../frame-processors/types';

const DISTANCE_THRESHOLD = 0.3; // 30% width
const CENTER_THRESHOLD = 0.2; // 20% offset from center

export const useUserGuidance = (
  face: SharedValue<IFaceDetection | null>,
  frameDimensions: SharedValue<{ width: number; height: number }>
) => {
  const guidance = useDerivedValue(() => {
    if (!face.value || frameDimensions.value.width === 0 || frameDimensions.value.height === 0) {
      return '';
    }

    const { width: faceWidth, left, top, height: faceHeight } = face.value.bounds;
    const { width: frameWidth, height: frameHeight } = frameDimensions.value;

    // Check Distance
    const relativeWidth = faceWidth / frameWidth;
    if (relativeWidth < DISTANCE_THRESHOLD) {
      return 'Move closer';
    }

    // Check Centering
    const faceCenterX = left + faceWidth / 2;
    const faceCenterY = top + faceHeight / 2;
    const frameCenterX = frameWidth / 2;
    const frameCenterY = frameHeight / 2;

    const offsetX = Math.abs(faceCenterX - frameCenterX) / frameWidth;
    const offsetY = Math.abs(faceCenterY - frameCenterY) / frameHeight;

    if (offsetX > CENTER_THRESHOLD || offsetY > CENTER_THRESHOLD) {
      return 'Center your face';
    }

    return 'Perfect, stay still';
  });

  return { guidance };
};

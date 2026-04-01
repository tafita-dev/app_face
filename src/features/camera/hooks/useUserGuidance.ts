import { useDerivedValue, SharedValue } from 'react-native-reanimated';
import { IFaceDetection } from '../frame-processors/types';
import { LivenessState } from '../../verification/liveness/useLivenessMachine';

const DISTANCE_THRESHOLD = 0.3; // 30% width
const CENTER_THRESHOLD = 0.2; // 20% offset from center

export const useUserGuidance = (
  face: SharedValue<IFaceDetection | null>,
  isLowLight: SharedValue<boolean>,
  frameDimensions: SharedValue<{ width: number; height: number }>,
  livenessState: LivenessState,
) => {
  const guidance = useDerivedValue(() => {
    // Priority 0: Environmental conditions
    if (isLowLight.value) {
      return 'Low light - move to a brighter area';
    }

    // Priority 1: Liveness Specific Instructions
    switch (livenessState) {
      case LivenessState.CHALLENGE_BLINK:
        return 'Blink your eyes';
      case LivenessState.CHALLENGE_SMILE:
        return 'Smile for the camera';
      case LivenessState.CHALLENGE_ROTATION:
        return 'Turn your head';
      case LivenessState.CHALLENGE_PITCH:
        return 'Tilt your head up/down';
      case LivenessState.ANALYZING:
        return 'Analyzing...';
      case LivenessState.FAILURE:
        return 'Try again';
      case LivenessState.SUCCESS:
        return 'Verification successful';
      default:
        break;
    }

    if (
      !face.value ||
      frameDimensions.value.width === 0 ||
      frameDimensions.value.height === 0
    ) {
      return 'Position your face in the guide';
    }

    const {
      width: faceWidth,
      left,
      top,
      height: faceHeight,
    } = face.value.bounds;
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
    
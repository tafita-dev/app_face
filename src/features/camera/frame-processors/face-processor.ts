import { Frame, VisionCameraProxy } from 'react-native-vision-camera';
import { IFaceDetection } from './types';

export const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  'FaceDetectorPlugin',
  {},
);

/**
 * Scans the given frame for faces and facial landmarks.
 * Returns an array of detected faces or null if no faces were found.
 */
export function trackFacialLandmarks(frame: Frame): IFaceDetection[] | null {
  'worklet';
  if (plugin == null) {
    return null;
  }
  const result = plugin.call(frame) as unknown as IFaceDetection[];
  if (!result || result.length === 0) {
    return null;
  }
  return result;
}

import { VisionCameraProxy, Frame } from 'react-native-vision-camera';
import { IFaceDetection } from './types';

const plugin = VisionCameraProxy.getFrameProcessorPlugin('scanFaces');

/**
 * Unified face processor worklet.
 * It calls the native JSI plugin 'scanFaces' which uses MLKit.
 */
export const scanFaces = (frame: Frame): IFaceDetection[] => {
  'worklet';
  if (plugin == null) {
    // In some environments (like some emulators or if not correctly registered)
    // the plugin might be null.
    return [];
  }
  return plugin.call(frame) as unknown as IFaceDetection[];
};

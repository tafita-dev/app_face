import { Frame, VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  'FaceDetectorPlugin',
  {},
);

export function scanFaces(frame: Frame) {
  'worklet';
  if (plugin == null) {
    return [];
  }
  return plugin.call(frame);
}

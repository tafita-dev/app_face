import { useFrameProcessor } from 'react-native-vision-camera';
import { Worklets } from 'react-native-worklets-core';

export const useTestFrameProcessor = () => {
  return useFrameProcessor((frame) => {
    'worklet';
    console.log(`Frame processed: ${frame.width}x${frame.height}`);
  }, []);
};

import { useFrameProcessor } from 'react-native-vision-camera';
import { useTestFrameProcessor } from './useFrameProcessor';

jest.mock('react-native-vision-camera', () => ({
  useFrameProcessor: jest.fn((callback) => callback),
}));

describe('useTestFrameProcessor', () => {
  it('should initialize the frame processor', () => {
    useTestFrameProcessor();
    expect(useFrameProcessor).toHaveBeenCalled();
  });
});

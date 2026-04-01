import { renderHook, act } from '@testing-library/react-native';
import { useScreenProtection } from './useScreenProtection';
import ScreenGuard from 'react-native-screen-guard';

jest.mock('react-native-screen-guard', () => ({
  registerRecordingListener: jest.fn(),
  registerScreenshotListener: jest.fn(),
  unregister: jest.fn(),
}), { virtual: true });

describe('useScreenProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register listeners on mount and unregister on unmount', () => {
    const { unmount } = renderHook(() => useScreenProtection());

    expect(ScreenGuard.registerRecordingListener).toHaveBeenCalled();
    expect(ScreenGuard.registerScreenshotListener).toHaveBeenCalled();

    unmount();
    expect(ScreenGuard.unregister).toHaveBeenCalled();
  });

  it('should set isRecording to true when recording is detected', () => {
    let recordingCallback: (data: any) => void = () => {};
    (ScreenGuard.registerRecordingListener as jest.Mock).mockImplementation((cb) => {
      recordingCallback = cb;
    });

    const { result } = renderHook(() => useScreenProtection());

    expect(result.current.isRecording).toBe(false);

    act(() => {
      recordingCallback({ isRecording: true });
    });

    expect(result.current.isRecording).toBe(true);
  });
});

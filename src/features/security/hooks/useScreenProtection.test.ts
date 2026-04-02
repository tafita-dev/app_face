import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useScreenProtection } from './useScreenProtection';
import ScreenGuard from 'react-native-screenguard';

// Mock react-native-screenguard
jest.mock('react-native-screenguard', () => ({
  initSettings: jest.fn(),
  register: jest.fn().mockResolvedValue(undefined),
  unregister: jest.fn(),
  listenScreenshot: jest.fn(),
  listenVideoRecording: jest.fn(),
}), { virtual: true });

describe('useScreenProtection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should register on mount, and unregister on unmount', async () => {
    const { unmount } = renderHook(() => useScreenProtection());

    await waitFor(() => {
      expect(ScreenGuard.register).toHaveBeenCalledWith(expect.objectContaining({
        color: '#000000',
        status: 'on',
      }));
    });

    unmount();
    expect(ScreenGuard.unregister).toHaveBeenCalled();
  });

  it('should set isRecording to true when video recording is detected', async () => {
    let recordingCallback: (res: any) => void = () => {};
    (ScreenGuard.listenVideoRecording as jest.Mock).mockImplementation((cb) => {
      recordingCallback = cb;
    });

    const { result } = renderHook(() => useScreenProtection());

    await waitFor(() => {
      expect(result.current.isRecording).toBe(false);
    });

    act(() => {
      recordingCallback(true);
    });

    expect(result.current.isRecording).toBe(true);

    act(() => {
      recordingCallback(false);
    });

    expect(result.current.isRecording).toBe(false);
  });
});

import { renderHook, act } from '@testing-library/react-native';
import { useAdaptiveSecurity } from './useAdaptiveSecurity';
import { useDispatch, useSelector } from 'react-redux';
import { adaptiveSecurityService } from '../adaptive-security-service';
import { useScreenProtection } from './useScreenProtection';
import { setSecurityContext } from '../../../store/app-slice';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('../adaptive-security-service', () => ({
  adaptiveSecurityService: {
    evaluateSecurityContext: jest.fn(),
  },
}));

jest.mock('./useScreenProtection', () => ({
  useScreenProtection: jest.fn(),
}));

describe('useAdaptiveSecurity', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => selector({
      app: { securityContext: 'NORMAL' }
    }));
    (useScreenProtection as jest.Mock).mockReturnValue({ isRecording: false });
    (adaptiveSecurityService.evaluateSecurityContext as jest.Mock).mockResolvedValue('NORMAL');
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should evaluate security context on mount', async () => {
    renderHook(() => useAdaptiveSecurity());

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(adaptiveSecurityService.evaluateSecurityContext).toHaveBeenCalledWith(false);
  });

  it('should dispatch setSecurityContext when evaluation changes', async () => {
    (adaptiveSecurityService.evaluateSecurityContext as jest.Mock).mockResolvedValue('HIGH_RISK');

    renderHook(() => useAdaptiveSecurity());

    await act(async () => {
      await Promise.resolve(); // Allow initial evaluation to complete
    });

    expect(mockDispatch).toHaveBeenCalledWith(setSecurityContext('HIGH_RISK'));
  });

  it('should re-evaluate when isRecording changes', async () => {
    const { rerender } = renderHook(() => useAdaptiveSecurity());

    (useScreenProtection as jest.Mock).mockReturnValue({ isRecording: true });
    (adaptiveSecurityService.evaluateSecurityContext as jest.Mock).mockResolvedValue('HIGH_RISK');

    await act(async () => {
      rerender({});
    });

    expect(adaptiveSecurityService.evaluateSecurityContext).toHaveBeenCalledWith(true);
    expect(mockDispatch).toHaveBeenCalledWith(setSecurityContext('HIGH_RISK'));
  });

  it('should re-evaluate periodically', async () => {
    renderHook(() => useAdaptiveSecurity());

    await act(async () => {
      jest.advanceTimersByTime(5000);
    });

    expect(adaptiveSecurityService.evaluateSecurityContext).toHaveBeenCalledTimes(2);
  });
});

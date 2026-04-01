import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ScanScreen } from './ScanScreen';
import { useLivenessMachine, LivenessState } from '../verification/liveness/useLivenessMachine';
import { useSelector, useDispatch } from 'react-redux';
import { checkDeviceIntegrity, useScreenProtection, useAdaptiveSecurity } from '../security';

jest.mock('../verification/liveness/useLivenessMachine');
jest.mock('../security', () => ({
  checkDeviceIntegrity: jest.fn(),
  useScreenProtection: jest.fn(),
  useAdaptiveSecurity: jest.fn(),
  lockoutService: {
    isLockedOut: jest.fn().mockResolvedValue(false),
    getRemainingLockoutTime: jest.fn().mockResolvedValue(0),
  },
}));
jest.mock('../verification/deepfake/hooks/useAntiDeepfakeModel', () => ({
  useAntiDeepfakeModel: () => ({ model: null }),
}));
jest.mock('../verification/biometrics/hooks/useBiometricModel', () => ({
  useBiometricModel: () => ({ model: null }),
}));

jest.mock('./CameraView', () => ({
  CameraView: () => null,
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => mockDispatch,
}));

const mockReplace = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    replace: mockReplace,
    navigate: mockNavigate,
  }),
}));

describe('ScanScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockReplace.mockClear();
    mockNavigate.mockClear();
    mockDispatch.mockClear();
    (useSelector as jest.Mock).mockImplementation(fn => 
      fn({ app: { verificationStatus: 'IDLE' } })
    );
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('SAFE');
    (useLivenessMachine as jest.Mock).mockReturnValue({
      state: LivenessState.INITIALIZING,
      progress: 0,
    });
    (useScreenProtection as jest.Mock).mockReturnValue({
      isRecording: false,
    });
    (useAdaptiveSecurity as jest.Mock).mockReturnValue({
      securityContext: 'NORMAL',
      isRecording: false,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('displays the unstable environment overlay when securityContext is UNSTABLE', () => {
    (useSelector as jest.Mock).mockImplementation(fn =>
      fn({ app: { verificationStatus: 'IDLE', securityContext: 'UNSTABLE' } })
    );

    const { getByTestId, getByText } = render(<ScanScreen />);
    
    expect(getByTestId('unstable-overlay')).toBeTruthy();
    expect(getByText('Low battery detected. Please plug in your device for reliable verification.')).toBeTruthy();
  });

  it('dispatches SECURITY_RISK when securityContext becomes HIGH_RISK', () => {
    (useSelector as jest.Mock).mockImplementation(fn =>
      fn({ app: { verificationStatus: 'IDLE', securityContext: 'HIGH_RISK' } })
    );

    render(<ScanScreen />);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'app/setVerificationResult',
      payload: expect.objectContaining({
        status: 'SECURITY_RISK',
        message: 'Security risk detected. Access restricted.'
      })
    }));
  });

  it('displays the screen recording warning and obscures view when isRecording is true', () => {
    (useAdaptiveSecurity as jest.Mock).mockReturnValue({
      securityContext: 'HIGH_RISK',
      isRecording: true,
    });

    const { getByText, getByTestId } = render(<ScanScreen />);
    
    expect(getByText('Screen recording detected. Please stop it to continue')).toBeTruthy();
    expect(getByTestId('recording-overlay')).toBeTruthy();
  });

  it('displays the progress bar and fills it proportionally', () => {
    (useLivenessMachine as jest.Mock).mockReturnValue({
      state: LivenessState.CHALLENGE_ROTATION,
      progress: 0.5,
    });

    const { getByTestId } = render(<ScanScreen />);
    
    const progressBar = getByTestId('progress-bar-fill');
    expect(progressBar).toBeTruthy();
  });

  it('displays "Analysing Security..." when state is ANALYZING', () => {
    (useLivenessMachine as jest.Mock).mockReturnValue({
      state: LivenessState.ANALYZING,
      progress: 1,
    });

    const { getByText } = render(<ScanScreen />);
    expect(getByText('Analysing Security...')).toBeTruthy();
  });

  it('navigates to Welcome after 2 seconds when verificationStatus is SUCCESS', () => {
    (useSelector as jest.Mock).mockImplementation(fn => 
      fn({ app: { verificationStatus: 'SUCCESS', verificationMessage: 'Verification Success' } })
    );

    (useLivenessMachine as jest.Mock).mockReturnValue({
      state: LivenessState.SUCCESS,
      progress: 1,
    });

    render(<ScanScreen />);
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockNavigate).toHaveBeenCalledWith('Welcome');
  });

  it('dispatches SECURITY_RISK and navigates to SecurityAlert if device is COMPROMISED', () => {
    (checkDeviceIntegrity as jest.Mock).mockReturnValue('COMPROMISED');

    render(<ScanScreen />);

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'app/setDeviceStatus',
      payload: 'COMPROMISED'
    }));

    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'app/setVerificationResult',
      payload: expect.objectContaining({
        status: 'SECURITY_RISK',
        message: 'Device Integrity Compromised. For your security, biometric authentication is disabled on rooted or jailbroken devices.'
      })
    }));
  });
});

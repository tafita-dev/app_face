import React from 'react';
import { render, act } from '@testing-library/react-native';
import { ScanScreen } from './ScanScreen';
import { useLivenessMachine, LivenessState } from '../verification/liveness/useLivenessMachine';
import { useSelector } from 'react-redux';

jest.mock('../verification/liveness/useLivenessMachine');
jest.mock('../verification/deepfake/hooks/useAntiDeepfakeModel', () => ({
  useAntiDeepfakeModel: () => ({ model: null }),
}));
jest.mock('../verification/biometrics/hooks/useBiometricModel', () => ({
  useBiometricModel: () => ({ model: null }),
}));

jest.mock('./CameraView', () => ({
  CameraView: () => null,
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: () => jest.fn(),
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
    (useSelector as jest.Mock).mockImplementation(fn => 
      fn({ app: { verificationStatus: 'IDLE' } })
    );
  });

  afterEach(() => {
    jest.useRealTimers();
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
});

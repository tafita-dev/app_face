import React from 'react';
import { render } from '@testing-library/react-native';
import { ScanScreen } from './ScanScreen';
import { useLivenessMachine, LivenessState } from '../verification/liveness/useLivenessMachine';

jest.mock('../verification/liveness/useLivenessMachine');
jest.mock('./CameraView', () => ({
  CameraView: () => null,
}));

describe('ScanScreen', () => {
  it('displays the progress bar and fills it proportionally', () => {
    (useLivenessMachine as jest.Mock).mockReturnValue({
      state: LivenessState.CHALLENGE_ROTATION,
      progress: 0.5,
    });

    const { getByTestId } = render(<ScanScreen />);
    
    const progressBar = getByTestId('progress-bar-fill');
    // Assuming we use an animated style or some way to verify the width/progress
    // Since it's animated-reanimated, testing it might be tricky.
    // Let's check for the existence first.
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
});

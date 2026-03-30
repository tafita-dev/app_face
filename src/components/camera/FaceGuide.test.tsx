import React from 'react';
import { render } from '@testing-library/react-native';
import { FaceGuide } from './FaceGuide';
import { makeMutable } from 'react-native-reanimated';
import { LivenessState } from '../../features/verification/liveness/useLivenessMachine';

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  return {
    Canvas: jest.fn(({ children }) => React.createElement('View', null, children)),
    Rect: jest.fn(() => null),
    Circle: jest.fn(() => null),
    Oval: jest.fn(() => null),
  };
});

describe('FaceGuide', () => {
  it('renders correctly', () => {
    const face = makeMutable(null);
    const frameDimensions = makeMutable({ width: 0, height: 0 });
    const { getByTestId } = render(
      <FaceGuide 
        face={face} 
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.POSITIONING}
      />
    );
    expect(getByTestId('face-guide')).toBeTruthy();
  });

  it('renders guidance text when a face is detected', () => {
    const face = makeMutable({
      bounds: { top: 10, left: 10, width: 10, height: 10 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    const { getByTestId } = render(
      <FaceGuide 
        face={face} 
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.CHALLENGE_BLINK}
      />
    );
    
    // In FaceGuide, we use a regular <Text> for guidance now, so we can find it by text or testID.
    // The guidance for CHALLENGE_BLINK is "Blink your eyes".
    const guidanceText = getByTestId('guidance-text');
    expect(guidanceText).toBeTruthy();
    expect(guidanceText.props.children).toBe('Blink your eyes');
  });

  it('displays correct guidance for CHALLENGE_BLINK', () => {
    const face = makeMutable({
      bounds: { top: 40, left: 40, width: 20, height: 20 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    const { getByText } = render(
      <FaceGuide 
        face={face} 
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.CHALLENGE_BLINK}
      />
    );
    expect(getByText('Blink your eyes')).toBeTruthy();
  });

  it('displays "Try again" on failure', () => {
    const face = makeMutable(null);
    const frameDimensions = makeMutable({ width: 0, height: 0 });
    const { getByText } = render(
      <FaceGuide 
        face={face} 
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.FAILURE}
      />
    );
    expect(getByText('Try again')).toBeTruthy();
  });
});

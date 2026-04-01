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
    Group: jest.fn(({ children }) => React.createElement('View', null, children)),
    vec: jest.fn((x, y) => ({ x, y })),
  };
});

describe('FaceGuide', () => {
  it('renders correctly', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 0, height: 0 });
    const { getByTestId } = render(
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
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
    } as any);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    const { getByTestId } = render(
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.CHALLENGE_BLINK}
      />
    );
    
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
    } as any);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    const { getByText } = render(
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.CHALLENGE_BLINK}
      />
    );
    expect(getByText('Blink your eyes')).toBeTruthy();
  });

  it('displays "Try again" on failure', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 0, height: 0 });
    const { getByText } = render(
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.FAILURE}
      />
    );
    expect(getByText('Try again')).toBeTruthy();
  });

  it('displays "Low light - move to a brighter area" when isLowLight is true', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(true);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    const { getByText } = render(
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
        frameDimensions={frameDimensions} 
        livenessState={LivenessState.POSITIONING}
      />
    );
    expect(getByText('Low light - move to a brighter area')).toBeTruthy();
  });
});

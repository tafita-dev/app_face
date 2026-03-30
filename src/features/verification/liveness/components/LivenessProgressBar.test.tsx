import React from 'react';
import { render } from '@testing-library/react-native';
import { LivenessProgressBar } from './LivenessProgressBar';

// Simple mock for reanimated to allow basic rendering
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: ({ children, style, ...props }: any) => React.createElement(View, { ...props, style }, children),
    },
    useSharedValue: jest.fn(val => ({ value: val })),
    useAnimatedStyle: jest.fn(fn => fn()),
    withTiming: jest.fn((val) => val),
  };
});

// Since we are using Animated.View, we also need to mock Animated
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.View = (props: any) => {
    const React = require('react');
    return React.createElement('View', props);
  };
  return RN;
});

describe('LivenessProgressBar', () => {
  it('renders correctly with 0 progress', () => {
    const { getByTestId } = render(<LivenessProgressBar progress={0} />);
    expect(getByTestId('progress-bar-container')).toBeTruthy();
  });

  it('renders correctly with 0.5 progress', () => {
    const { getByTestId } = render(<LivenessProgressBar progress={0.5} />);
    expect(getByTestId('progress-bar-container')).toBeTruthy();
  });
});
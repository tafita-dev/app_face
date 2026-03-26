import React from 'react';
import { render } from '@testing-library/react-native';
import { FaceGuide } from './FaceGuide';
import { makeMutable } from 'react-native-reanimated';

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
    const { getByTestId } = render(<FaceGuide face={face} frameDimensions={frameDimensions} />);
    expect(getByTestId('face-guide')).toBeTruthy();
  });

  // Since Skia components are mocked to return null, we can't easily check if Rect/Circle are called with right props in a simple way without deeper mocking
  // But we can verify the component doesn't crash and renders the container.
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { FaceGuide } from './FaceGuide';

jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  return {
    Canvas: jest.fn(({ children }) => React.createElement('View', null, children)),
    Oval: jest.fn(() => null),
    Paint: jest.fn(() => null),
  };
});

describe('FaceGuide', () => {
  it('renders correctly', () => {
    const { getByTestId } = render(<FaceGuide />);
    expect(getByTestId('face-guide')).toBeTruthy();
  });
});

import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from '../store';
import { RootNavigator } from './root-navigator';

// Mock navigation dependencies
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
}));

describe('RootNavigator', () => {
  it('should render Welcome screen as initial route', () => {
    const { getByText } = render(
      <Provider store={store}>
        <SafeAreaProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </SafeAreaProvider>
      </Provider>
    );

    expect(getByText('AureliusSecureFace')).toBeTruthy();
    expect(getByText('Secure Biometric Intelligence')).toBeTruthy();
  });
});

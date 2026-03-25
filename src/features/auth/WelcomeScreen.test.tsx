import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { WelcomeScreen } from './WelcomeScreen';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';
import { useNavigation } from '@react-navigation/native';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: jest.fn(),
}));

// Mock the hook
jest.mock('../../hooks/useCameraPermissions');

describe('WelcomeScreen', () => {
  const mockNavigate = jest.fn();
  const mockRequestPermission = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigation as jest.Mock).mockReturnValue({ navigate: mockNavigate });
    (useCameraPermissions as jest.Mock).mockReturnValue({
      status: 'not-determined',
      requestPermission: mockRequestPermission,
      isGranted: false,
      isDenied: false,
    });
  });

  it('should render "Start Enrollment" button when permission is not determined', () => {
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Start Enrollment')).toBeTruthy();
  });

  it('should request permission when "Start Enrollment" is pressed', async () => {
    const { getByText } = render(<WelcomeScreen />);
    
    fireEvent.press(getByText('Start Enrollment'));
    
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it('should navigate to Scan when permission is already granted', async () => {
    (useCameraPermissions as jest.Mock).mockReturnValue({
      status: 'granted',
      requestPermission: mockRequestPermission,
      isGranted: true,
      isDenied: false,
    });
    
    render(<WelcomeScreen />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Scan');
    });
  });

  it('should show "Go to Settings" button when permission is denied', () => {
    (useCameraPermissions as jest.Mock).mockReturnValue({
      status: 'denied',
      requestPermission: mockRequestPermission,
      isGranted: false,
      isDenied: true,
    });
    
    const { getByText } = render(<WelcomeScreen />);
    expect(getByText('Camera Access Required')).toBeTruthy();
    expect(getByText('Open Settings')).toBeTruthy();
  });
});

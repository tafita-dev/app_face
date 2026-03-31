import { renderHook, waitFor } from '@testing-library/react-native';
import { useBiometricModel } from './useBiometricModel';
import { loadTensorflowModel } from 'react-native-fast-tflite';

// Mock react-native-fast-tflite
jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

const mockLoadTensorflowModel = loadTensorflowModel as jest.Mock;

describe('useBiometricModel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with null and then load the model', async () => {
    const mockModel = { run: jest.fn() };
    mockLoadTensorflowModel.mockResolvedValue(mockModel);

    const { result } = renderHook(() => useBiometricModel());

    expect(result.current.isLoaded).toBe(false);
    expect(result.current.model).toBeNull();

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).toBe(mockModel);
    expect(mockLoadTensorflowModel).toHaveBeenCalled();
  });

  it('should handle loading errors', async () => {
    const error = new Error('Failed to load');
    mockLoadTensorflowModel.mockRejectedValue(error);

    const { result } = renderHook(() => useBiometricModel());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.error).toBe(error);
  });
});

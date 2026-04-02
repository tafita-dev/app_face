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

  it('should provide a deterministic mock model during development/test', async () => {
    const { result } = renderHook(() => useBiometricModel());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).not.toBeNull();
    expect(mockLoadTensorflowModel).not.toHaveBeenCalled();

    const output = result.current.model?.run([new Uint8Array(112 * 112 * 3)]);
    expect(output?.[0]).toBeInstanceOf(Float32Array);
    expect(output?.[0].length).toBe(128);
  });

  it('should provide a mock model in development mode if loading fails', async () => {
    const error = new Error('Failed to load');
    mockLoadTensorflowModel.mockRejectedValue(error);

    const { result } = renderHook(() => useBiometricModel());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).not.toBeNull();
    expect(result.current.error).toBeNull();

    // Verify mock model output
    const mockOutput = result.current.model?.run([new Uint8Array(112 * 112 * 3)]);
    expect(mockOutput).toBeDefined();
    expect(mockOutput![0]).toBeInstanceOf(Float32Array);
    expect(mockOutput![0].length).toBe(128);
  });
});

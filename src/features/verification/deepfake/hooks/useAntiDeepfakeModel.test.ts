import { renderHook, waitFor } from '@testing-library/react-native';
import { useAntiDeepfakeModel } from './useAntiDeepfakeModel';
import { loadTensorflowModel } from 'react-native-fast-tflite';

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

describe('useAntiDeepfakeModel', () => {
  it('should provide a safe mock model during development/test', async () => {
    const { result } = renderHook(() => useAntiDeepfakeModel());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).not.toBeNull();
    expect(result.current.model?.run([[1]])[0][0]).toBe(0.05);
    expect(loadTensorflowModel).not.toHaveBeenCalled();
  });

  it('should provide a mock model in development mode if loading fails', async () => {
    (loadTensorflowModel as jest.Mock).mockRejectedValue(new Error('Model not found'));

    const { result } = renderHook(() => useAntiDeepfakeModel());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).not.toBeNull();
    expect(result.current.model?.run).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});

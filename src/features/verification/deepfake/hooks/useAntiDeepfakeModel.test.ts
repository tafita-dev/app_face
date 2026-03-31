import { renderHook, waitFor } from '@testing-library/react-native';
import { useAntiDeepfakeModel } from './useAntiDeepfakeModel';
import { loadTensorflowModel } from 'react-native-fast-tflite';

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: jest.fn(),
}));

describe('useAntiDeepfakeModel', () => {
  it('should load the model on mount', async () => {
    const mockModel = { run: jest.fn() };
    (loadTensorflowModel as jest.Mock).mockResolvedValue(mockModel);

    const { result } = renderHook(() => useAntiDeepfakeModel());

    await waitFor(() => expect(result.current.isLoaded).toBe(true));
    expect(result.current.model).toBe(mockModel);
    expect(loadTensorflowModel).toHaveBeenCalled();
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

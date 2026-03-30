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

  it('should handle loading errors gracefully', async () => {
    (loadTensorflowModel as jest.Mock).mockRejectedValue(new Error('Model not found'));

    const { result } = renderHook(() => useAntiDeepfakeModel());

    await waitFor(() => expect(result.current.error).toBeDefined());
    expect(result.current.isLoaded).toBe(false);
    expect(result.current.model).toBeNull();
  });
});

import { extractEmbedding } from './embedding-service';
import { TensorflowModel } from 'react-native-fast-tflite';

// Mock react-native-fast-tflite
const mockRun = jest.fn();
const mockModel: Partial<TensorflowModel> = {
  run: mockRun,
  inputs: [{ name: 'input', type: 'float32', shape: [1, 112, 112, 3] }],
  outputs: [{ name: 'output', type: 'float32', shape: [1, 128] }],
};

describe('embedding-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if model is not provided', async () => {
    const input = new Uint8Array(112 * 112 * 3);
    await expect(extractEmbedding(null as any, input)).rejects.toThrow('Model not loaded');
  });

  it('should throw an error if input is invalid', async () => {
    await expect(extractEmbedding(mockModel as any, new Uint8Array(0))).rejects.toThrow('Invalid input image');
  });

  it('should return a 128-D float array when successful', async () => {
    const input = new Uint8Array(112 * 112 * 3).fill(128);
    const mockOutput = new Float32Array(128).fill(0.1);
    mockRun.mockResolvedValue([mockOutput]);

    const result = await extractEmbedding(mockModel as any, input);

    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(128);
    expect(mockRun).toHaveBeenCalled();
    
    // Check normalization (approximate L2 normalization)
    const magnitude = Math.sqrt(result.reduce((acc, val) => acc + val * val, 0));
    expect(magnitude).toBeCloseTo(1, 5);
  });
});

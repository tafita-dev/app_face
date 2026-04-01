import { obfuscateEmbedding, deobfuscateEmbedding } from './embedding-obfuscation';

// Mock DeviceInfo
jest.mock('react-native-device-info', () => ({
  getUniqueIdSync: jest.fn(() => 'test-device-id'),
}), { virtual: true });

describe('Embedding Obfuscation', () => {
  const originalEmbedding = new Float32Array([0.1, -0.5, 0.9, 0.0, 1.0]);

  it('should obfuscate the embedding so it does not match the original', () => {
    const obfuscated = obfuscateEmbedding(originalEmbedding);
    
    // Check it's not the same reference and values differ
    expect(obfuscated).not.toBe(originalEmbedding);
    
    let allSame = true;
    for (let i = 0; i < originalEmbedding.length; i++) {
      if (obfuscated[i] !== originalEmbedding[i]) {
        allSame = false;
        break;
      }
    }
    expect(allSame).toBe(false);
  });

  it('should deobfuscate correctly to the original values', () => {
    const obfuscated = obfuscateEmbedding(originalEmbedding);
    const deobfuscated = deobfuscateEmbedding(obfuscated);
    
    expect(deobfuscated.length).toBe(originalEmbedding.length);
    for (let i = 0; i < originalEmbedding.length; i++) {
      // Use toBeCloseTo for floating point comparisons if needed, 
      // but XOR on bit-level representation should be exact if done right.
      expect(deobfuscated[i]).toBeCloseTo(originalEmbedding[i], 10);
    }
  });

  it('should be consistent across multiple operations', () => {
    const obfuscated1 = obfuscateEmbedding(originalEmbedding);
    const obfuscated2 = obfuscateEmbedding(originalEmbedding);
    
    expect(obfuscated1).toEqual(obfuscated2);
  });
});

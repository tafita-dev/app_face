import { cropFace, extractTemporalFeatures } from './image-utils';

describe('image-utils', () => {
  describe('cropFace', () => {
    it('should return a Uint8Array of the correct size', () => {
      const mockFrame = {
        width: 100,
        height: 100,
        toArrayBuffer: jest.fn(() => new ArrayBuffer(100 * 100 * 4)), // RGBA
      } as any;

      const bounds = { left: 10, top: 10, width: 50, height: 50 };
      const targetSize = 224;

      const result = cropFace(mockFrame, bounds, targetSize);

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(targetSize * targetSize * 3); // RGB
    });
  });

  describe('extractTemporalFeatures', () => {
    it('should extract highlights and edge variance', () => {
      const mockData = new Uint8Array(100 * 100 * 4).fill(128);
      const mockFrame = {
        width: 100,
        height: 100,
        toArrayBuffer: jest.fn(() => mockData.buffer),
      } as any;

      const landmarks = {
        leftEye: { x: 10, y: 10 },
        rightEye: { x: 20, y: 10 },
      };
      const bounds = { left: 0, top: 0, width: 30, height: 30 };

      const result = extractTemporalFeatures(mockFrame, landmarks, bounds);

      expect(result.highlights).toBe(128);
      expect(result.edgeVariance).toBe(0); // All gray, so no variance
    });
  });
});

import { cropFace } from './image-utils';

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

import { compareEmbeddings } from './matching-service';

describe('matching-service', () => {
  it('should return a high similarity score and isMatch true for identical embeddings', () => {
    const embedding = new Float32Array(128).fill(0.1);
    // Normalize it manually for a predictable dot product
    const magnitude = Math.sqrt(embedding.reduce((acc, val) => acc + val * val, 0));
    for (let i = 0; i < embedding.length; i++) embedding[i] /= magnitude;

    const result = compareEmbeddings(embedding, embedding);

    expect(result.similarity).toBeCloseTo(1.0, 5);
    expect(result.isMatch).toBe(true);
  });

  it('should return isMatch false for orthogonal embeddings', () => {
    const e1 = new Float32Array(128).fill(0);
    e1[0] = 1;
    const e2 = new Float32Array(128).fill(0);
    e2[1] = 1;

    const result = compareEmbeddings(e1, e2);

    expect(result.similarity).toBeCloseTo(0, 5);
    expect(result.isMatch).toBe(false);
  });

  it('should use a custom threshold correctly', () => {
    const e1 = new Float32Array(128).fill(0);
    e1[0] = 1;
    const e2 = new Float32Array(128).fill(0);
    // Similarity will be 0.8
    e2[0] = 0.8;
    e2[1] = 0.6; // sqrt(0.8^2 + 0.6^2) = 1

    const resultMatch = compareEmbeddings(e1, e2, 0.75);
    expect(resultMatch.similarity).toBeCloseTo(0.8, 5);
    expect(resultMatch.isMatch).toBe(true);

    const resultNoMatch = compareEmbeddings(e1, e2, 0.85);
    expect(resultNoMatch.isMatch).toBe(false);
  });

  it('should strictly follow the "above" threshold rule (similarity > threshold)', () => {
    const e1 = new Float32Array([1, 0]);
    const e2_below = new Float32Array([0.84999, 0.5268]);
    const e2_above = new Float32Array([0.85001, 0.52676]);

    expect(compareEmbeddings(e1, e2_below, 0.85).isMatch).toBe(false);
    expect(compareEmbeddings(e1, e2_above, 0.85).isMatch).toBe(true);
  });

  it('should throw an error if embeddings have different lengths', () => {
    const e1 = new Float32Array(128);
    const e2 = new Float32Array(512);

    expect(() => compareEmbeddings(e1, e2)).toThrow('Embeddings must have the same length');
  });
});

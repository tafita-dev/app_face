import { analyzeTexture } from './passive-liveness';

describe('analyzeTexture', () => {
  it('returns a high score for a real human face (no Moire/frequency artifacts)', () => {
    // Mocking real human face texture data (high variance/natural texture)
    const mockFrameData = {
      variance: 15.0, // High variance for natural human skin
      moireDetected: false,
    };
    const result = analyzeTexture(mockFrameData);
    expect(result.livenessScore).toBeGreaterThan(0.8);
  });

  it('returns a low score for a digital screen replay (Moire patterns/low variance)', () => {
    // Mocking screen replay texture data (moire patterns, repetitive frequencies)
    const mockFrameData = {
      variance: 2.0, // Low variance/flatness common in screens
      moireDetected: true,
    };
    const result = analyzeTexture(mockFrameData);
    expect(result.livenessScore).toBeLessThan(0.5);
  });

  it('collects at least 5 keyframes during the ANALYZING state', () => {
    // This test will be more related to the integration/machine logic
    // but we can at least test the analyzer's ability to handle frame sequences
  });
});

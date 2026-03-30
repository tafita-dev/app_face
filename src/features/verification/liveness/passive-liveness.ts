export interface FrameAnalysisData {
  variance: number; // Laplacian variance or pixel variance
  moireDetected: boolean;
}

export interface LivenessResult {
  livenessScore: number;
}

/**
 * Analyzes the texture data of a frame to detect digital replays or paper masks.
 * 
 * Logic:
 * - Low variance (blurriness or flatness) reduces the score.
 * - Moire detection significantly reduces the score.
 * - High variance (natural skin texture) increases the score.
 */
export const analyzeTexture = (data: FrameAnalysisData): LivenessResult => {
  let score = 0.5; // Start with a baseline score

  // Variance check (Laplacian/Pixel)
  // Real human skin tends to have natural textures that generate moderate to high variance
  // Screen replays or paper masks often result in lower variance due to pixelation or flatness.
  if (data.variance > 10) {
    score += 0.4; // Strong indicator of real texture
  } else if (data.variance < 4) {
    score -= 0.3; // Indicator of flatness/blurriness
  }

  // Moire/Frequency Artifact Check
  if (data.moireDetected) {
    score -= 0.5; // Strong indicator of a screen replay
  } else {
    score += 0.1; // Slight confidence boost if no Moire detected
  }

  // Clamp the score between 0 and 1
  score = Math.max(0, Math.min(1, score));

  return { livenessScore: score };
};

export interface DeepfakeAnalysisInput {
  ganScore: number;
  temporalConsistency: number; // 0 (inconsistent) to 1 (consistent)
}

/**
 * Service to aggregate various anti-deepfake analysis results.
 */
export const DeepfakeService = {
  /**
   * Calculates a weighted Deepfake Confidence Score (0.0 to 1.0).
   * 
   * GAN Artifact weight: 0.7
   * Temporal Inconsistency weight: 0.3
   */
  calculateScore: (input: DeepfakeAnalysisInput): number => {
    const ganWeight = 0.7;
    const temporalWeight = 0.3;

    // GAN score is already a probability of being a deepfake (0-1)
    // Temporal Consistency of 1 means real, 0 means deepfake.
    // So we use (1 - temporalConsistency) as the deepfake probability from temporal analysis.
    const temporalDeepfakeProb = 1 - input.temporalConsistency;

    const aggregatedScore = (input.ganScore * ganWeight) + (temporalDeepfakeProb * temporalWeight);

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, aggregatedScore));
  },

  /**
   * Checks if the deepfake score is high enough to be considered a security risk.
   */
  isSecurityRisk: (score: number): boolean => {
    return score > 0.8;
  },
};

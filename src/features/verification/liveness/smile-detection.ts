export const SMILE_THRESHOLD = 0.7;

/**
 * Detects if the user is smiling based on the probability provided by the face detector.
 * @param probability The probability of the user smiling (0.0 to 1.0).
 * @returns True if the user is smiling above the threshold.
 */
export const detectSmile = (probability: number): boolean => {
  return probability > SMILE_THRESHOLD;
};

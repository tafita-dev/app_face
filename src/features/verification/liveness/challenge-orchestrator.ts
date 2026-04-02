import { LivenessState } from './types';

export type ChallengeType = 
  | LivenessState.CHALLENGE_BLINK 
  | LivenessState.CHALLENGE_SMILE 
  | LivenessState.CHALLENGE_ROTATION 
  | LivenessState.CHALLENGE_PITCH;

const DEFAULT_CHALLENGES: ChallengeType[] = [
  LivenessState.CHALLENGE_BLINK,
  LivenessState.CHALLENGE_SMILE,
  LivenessState.CHALLENGE_PITCH,
];

/**
 * Orchestrates the sequence of active liveness challenges.
 */
export class ChallengeOrchestrator {
  /**
   * Generates a randomized sequence of challenges.
   * @param deepfakeScore Optional deepfake score to adapt the sequence complexity.
   * @param sessionId Optional session ID to seed the randomization for reproducibility.
   * @returns A list of LivenessStates representing the challenge sequence.
   */
  static generateSequence(deepfakeScore?: number, sessionId?: string): ChallengeType[] {
    const sequence = [...DEFAULT_CHALLENGES];
    
    // Seeded random if sessionId is provided
    const random = sessionId ? this.seededRandom(sessionId) : Math.random;

    // Shuffle using Fisher-Yates algorithm
    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }

    // Ensure we start with 2 challenges
    let finalSequence = sequence.slice(0, 2);

    // Adaptive Logic: Inject extra "Head Rotation" challenge if deepfake score is suspicious
    if (deepfakeScore !== undefined && deepfakeScore >= 0.5 && deepfakeScore <= 0.8) {
      if (!finalSequence.includes(LivenessState.CHALLENGE_ROTATION)) {
        finalSequence.push(LivenessState.CHALLENGE_ROTATION);
      }
    }

    return finalSequence;
  }

  /**
   * Simple Mulberry32 seeded random generator.
   */
  private static seededRandom(seed: string) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    }
    
    return () => {
      h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
      h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }
}

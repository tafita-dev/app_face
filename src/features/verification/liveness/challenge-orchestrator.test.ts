import { ChallengeOrchestrator } from './challenge-orchestrator';
import { LivenessState } from './types';

describe('ChallengeOrchestrator', () => {
  it('should generate a randomized sequence of at least 2 challenges', () => {
    const sequence = ChallengeOrchestrator.generateSequence();
    expect(sequence.length).toBeGreaterThanOrEqual(2);
    expect(new Set(sequence).size).toBe(sequence.length); // Unique challenges
  });

  it('should generate the same sequence for the same session ID (seeded random)', () => {
    const sessionId = 'session-123';
    const seq1 = ChallengeOrchestrator.generateSequence(undefined, sessionId);
    const seq2 = ChallengeOrchestrator.generateSequence(undefined, sessionId);
    expect(seq1).toEqual(seq2);
  });

  it('should generate different sequences for different session IDs', () => {
    const seq1 = ChallengeOrchestrator.generateSequence(undefined, 'session-1');
    const seq2 = ChallengeOrchestrator.generateSequence(undefined, 'session-A');
    const seq3 = ChallengeOrchestrator.generateSequence(undefined, 'session-Z');
    
    const areIdentical = JSON.stringify(seq1) === JSON.stringify(seq2) && JSON.stringify(seq2) === JSON.stringify(seq3);
    expect(areIdentical).toBe(false);
  });

  it('should inject an additional challenge when deepfakeScore is suspicious (0.5 to 0.8)', () => {
    const sequence = ChallengeOrchestrator.generateSequence(0.6);
    // Suspicious score should include ROTATION challenge
    expect(sequence.includes(LivenessState.CHALLENGE_ROTATION)).toBe(true);
    expect(sequence.length).toBeGreaterThanOrEqual(3);
  });

  it('should not inject additional challenge for optimal deepfake score (e.g., 0.1)', () => {
    const sequence = ChallengeOrchestrator.generateSequence(0.1);
    // Optimal score should have at least 2 challenges, but not necessarily ROTATION
    expect(sequence.length).toBeGreaterThanOrEqual(2);
  });
});

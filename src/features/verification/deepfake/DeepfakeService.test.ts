import { DeepfakeService } from './DeepfakeService';

describe('DeepfakeService', () => {
  describe('calculateScore', () => {
    it('should calculate high score when both indicators are high', () => {
      const input = { ganScore: 0.9, temporalConsistency: 0.1 };
      const score = DeepfakeService.calculateScore(input);
      // (0.9 * 0.7) + (0.9 * 0.3) = 0.63 + 0.27 = 0.9
      expect(score).toBeCloseTo(0.9);
    });

    it('should calculate low score when both indicators are low', () => {
      const input = { ganScore: 0.1, temporalConsistency: 0.9 };
      const score = DeepfakeService.calculateScore(input);
      // (0.1 * 0.7) + (0.1 * 0.3) = 0.07 + 0.03 = 0.1
      expect(score).toBeCloseTo(0.1);
    });

    it('should favor GAN artifact detection (higher weight)', () => {
      const input1 = { ganScore: 0.9, temporalConsistency: 0.9 };
      // (0.9 * 0.7) + (0.1 * 0.3) = 0.63 + 0.03 = 0.66
      expect(DeepfakeService.calculateScore(input1)).toBeCloseTo(0.66);

      const input2 = { ganScore: 0.1, temporalConsistency: 0.1 };
      // (0.1 * 0.7) + (0.9 * 0.3) = 0.07 + 0.27 = 0.34
      expect(DeepfakeService.calculateScore(input2)).toBeCloseTo(0.34);
    });

    it('should clamp scores between 0 and 1', () => {
      expect(DeepfakeService.calculateScore({ ganScore: -0.1, temporalConsistency: 1.1 })).toBe(0);
      expect(DeepfakeService.calculateScore({ ganScore: 1.1, temporalConsistency: -0.1 })).toBe(1);
    });
  });

  describe('isSecurityRisk', () => {
    it('should return true for scores > 0.8', () => {
      expect(DeepfakeService.isSecurityRisk(0.81)).toBe(true);
      expect(DeepfakeService.isSecurityRisk(0.95)).toBe(true);
    });

    it('should return false for scores <= 0.8', () => {
      expect(DeepfakeService.isSecurityRisk(0.8)).toBe(false);
      expect(DeepfakeService.isSecurityRisk(0.5)).toBe(false);
    });
  });
});

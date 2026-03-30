import { detectRotation, detectPitch, checkTemporalInconsistency, MovementState, SMOOTHING_WINDOW_SIZE } from './movement-detection';

describe('Movement Detection Utility', () => {
  describe('detectRotation (Yaw)', () => {
    let state: MovementState;

    beforeEach(() => {
      state = {
        history: new Array(SMOOTHING_WINDOW_SIZE).fill(0),
        lastValue: 0,
      };
    });

    it('returns true when yaw exceeds 20 degrees', () => {
      // Fill history with 25
      state.history = new Array(SMOOTHING_WINDOW_SIZE).fill(25);
      expect(detectRotation(25, state)).toBe(true);
    });

    it('returns false when yaw is below 20 degrees', () => {
      expect(detectRotation(15, state)).toBe(false);
    });

    it('handles negative angles (turn other side)', () => {
      state.history = new Array(SMOOTHING_WINDOW_SIZE).fill(-25);
      expect(detectRotation(-25, state)).toBe(true);
    });

    it('uses smoothing filter (moving average)', () => {
      // state.history is [0, 0, 0, 0, 0]
      expect(detectRotation(25, state)).toBe(false); // [0, 0, 0, 0, 25] avg = 5
      expect(detectRotation(25, state)).toBe(false); // [0, 0, 0, 25, 25] avg = 10
      expect(detectRotation(25, state)).toBe(false); // [0, 0, 25, 25, 25] avg = 15
      expect(detectRotation(25, state)).toBe(false); // [0, 25, 25, 25, 25] avg = 20
      expect(detectRotation(25, state)).toBe(true); // [25, 25, 25, 25, 25] avg = 25
    });
  });

  describe('detectPitch', () => {
    let state: MovementState;

    beforeEach(() => {
      state = {
        history: new Array(SMOOTHING_WINDOW_SIZE).fill(0),
        lastValue: 0,
      };
    });

    it('returns true when pitch exceeds 15 degrees', () => {
      state.history = new Array(SMOOTHING_WINDOW_SIZE).fill(20);
      expect(detectPitch(20, state)).toBe(true);
    });

    it('returns false when pitch is below 15 degrees', () => {
      expect(detectPitch(10, state)).toBe(false);
    });
  });

  describe('checkTemporalInconsistency', () => {
    it('returns true if angle changes by more than 40 degrees in one frame', () => {
      expect(checkTemporalInconsistency(0, 45)).toBe(true);
      expect(checkTemporalInconsistency(10, 55)).toBe(true);
      expect(checkTemporalInconsistency(10, -35)).toBe(true);
    });

    it('returns false if angle change is normal', () => {
      expect(checkTemporalInconsistency(0, 10)).toBe(false);
      expect(checkTemporalInconsistency(20, 30)).toBe(false);
    });
  });
});

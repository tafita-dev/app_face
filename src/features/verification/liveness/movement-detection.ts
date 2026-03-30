export const YAW_ROTATION_THRESHOLD = 20;
export const PITCH_THRESHOLD = 15;
export const TEMPORAL_INCONSISTENCY_THRESHOLD = 40;
export const SMOOTHING_WINDOW_SIZE = 5;

export interface MovementState {
  history: number[];
  lastValue: number;
}

const getMovingAverage = (newValue: number, history: number[], windowSize: number): number => {
  history.push(newValue);
  if (history.length > windowSize) {
    history.shift();
  }
  const sum = history.reduce((a, b) => a + b, 0);
  return sum / history.length;
};

/**
 * Detects if the user turned their head left/right more than YAW_ROTATION_THRESHOLD degrees.
 * Uses a moving average to smooth the input signal.
 * Angles can be negative (left turn) or positive (right turn).
 */
export const detectRotation = (yaw: number, state: MovementState): boolean => {
  const smoothedYaw = getMovingAverage(yaw, state.history, SMOOTHING_WINDOW_SIZE);
  state.lastValue = smoothedYaw;
  return Math.abs(smoothedYaw) > YAW_ROTATION_THRESHOLD;
};

/**
 * Detects if the user tilted their head up/down more than PITCH_THRESHOLD degrees.
 */
export const detectPitch = (pitch: number, state: MovementState): boolean => {
  const smoothedPitch = getMovingAverage(pitch, state.history, SMOOTHING_WINDOW_SIZE);
  state.lastValue = smoothedPitch;
  return Math.abs(smoothedPitch) > PITCH_THRESHOLD;
};

/**
 * Checks if the head movement is physically possible for a human.
 * If the angle changes too rapidly in a single frame, it might be a 2D replay or attack.
 */
export const checkTemporalInconsistency = (previousAngle: number, currentAngle: number): boolean => {
  return Math.abs(currentAngle - previousAngle) > TEMPORAL_INCONSISTENCY_THRESHOLD;
};

import { IFaceLandmark } from '../../camera/frame-processors/types';

export const EAR_CLOSED_THRESHOLD = 0.22;
export const EAR_OPEN_THRESHOLD = 0.3;
export const BLINK_TIMEOUT_MS = 1000;

export interface BlinkState {
  hasClosed: boolean;
  lastTimestamp: number;
}

const dist = (p1: IFaceLandmark, p2: IFaceLandmark): number => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

/**
 * Calculates Eye Aspect Ratio (EAR)
 * points: 6 points for an eye
 * formula: (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4))
 */
export const calculateEAR = (points: IFaceLandmark[]): number => {
  if (points.length < 6) return 0;

  const dVertical1 = dist(points[1], points[5]);
  const dVertical2 = dist(points[2], points[4]);
  const dHorizontal = dist(points[0], points[3]);

  if (dHorizontal === 0) return 0;

  return (dVertical1 + dVertical2) / (2 * dHorizontal);
};

export const isEyeClosed = (ear: number): boolean => {
  return ear < EAR_CLOSED_THRESHOLD;
};

export const detectBlink = (
  leftEAR: number,
  rightEAR: number,
  state: BlinkState,
  timestamp: number,
): boolean => {
  const leftClosed = isEyeClosed(leftEAR);
  const rightClosed = isEyeClosed(rightEAR);
  const bothClosed = leftClosed && rightClosed;

  if (state.hasClosed) {
    // If eyes were closed, check if they are now open
    if (timestamp - state.lastTimestamp > BLINK_TIMEOUT_MS) {
      // Timeout - reset
      state.hasClosed = false;
      return false;
    }

    if (!leftClosed && !rightClosed) {
      // Both eyes opened - Blink Detected!
      state.hasClosed = false;
      return true;
    }
    
    // Still closed or partially closed
    return false;
  } else {
    // Check for both eyes closed to start blink sequence
    if (bothClosed) {
      state.hasClosed = true;
      state.lastTimestamp = timestamp;
    }
    return false;
  }
};

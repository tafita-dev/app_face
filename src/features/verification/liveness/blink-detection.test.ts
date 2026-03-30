import { calculateEAR, isEyeClosed, detectBlink } from './blink-detection';
import { IFaceDetection, IFaceLandmark } from '../../camera/frame-processors/types';
import { extractEARPoints } from './useLivenessMachine';

describe('Blink Detection Utility', () => {
  const mockLandmark = (x: number, y: number): IFaceLandmark => ({ x, y });

  const createMock16PointEye = (isOpen: boolean): IFaceLandmark[] => {
    // A simplified 16-point eye contour (circular)
    // 0: Left, 8: Right
    // 4: Top, 12: Bottom
    const points: IFaceLandmark[] = [];
    const radiusX = 10;
    const radiusY = isOpen ? 5 : 1;
    const centerX = 50;
    const centerY = 50;

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.PI; // Start from Left (PI)
      points.push({
        x: centerX + Math.cos(angle) * radiusX,
        y: centerY + Math.sin(angle) * radiusY,
      });
    }
    return points;
  };

  it('calculates EAR correctly from 16-point MLKit contour', () => {
    const openEye16 = createMock16PointEye(true);
    const mappedPoints = extractEARPoints(openEye16);
    
    expect(mappedPoints.length).toBe(6);
    
    const ear = calculateEAR(mappedPoints);
    // For our circular mock:
    // p1: index 0 (Left) -> (-10, 0) relative to center
    // p4: index 8 (Right) -> (10, 0) relative to center
    // Horizontal dist = 20
    // p2: index 2 -> Top-Leftish
    // p6: index 14 -> Bottom-Leftish
    // p3: index 6 -> Top-Rightish
    // p5: index 10 -> Bottom-Rightish
    
    expect(ear).toBeGreaterThan(0.25);
    expect(isEyeClosed(ear)).toBe(false);

    const closedEye16 = createMock16PointEye(false);
    const mappedClosedPoints = extractEARPoints(closedEye16);
    const closedEar = calculateEAR(mappedClosedPoints);
    
    expect(closedEar).toBeLessThan(0.1);
    expect(isEyeClosed(closedEar)).toBe(true);
  });

  it('calculates EAR correctly', () => {
    const eyePoints: IFaceLandmark[] = [
      mockLandmark(0, 5),  // p1
      mockLandmark(2, 4),  // p2
      mockLandmark(4, 4),  // p3
      mockLandmark(6, 5),  // p4
      mockLandmark(4, 6),  // p5
      mockLandmark(2, 6),  // p6
    ];
    // EAR = (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4))
    // dist(p2, p6) = sqrt((2-2)^2 + (6-4)^2) = 2
    // dist(p3, p5) = sqrt((4-4)^2 + (6-4)^2) = 2
    // dist(p1, p4) = sqrt((6-0)^2 + (5-5)^2) = 6
    // EAR = (2 + 2) / (2 * 6) = 4 / 12 = 0.333
    expect(calculateEAR(eyePoints)).toBeCloseTo(0.333, 3);
  });

  it('detects eye as closed when EAR is below threshold', () => {
    const closedEye: IFaceLandmark[] = [
      mockLandmark(0, 5),
      mockLandmark(2, 4.9),
      mockLandmark(4, 4.9),
      mockLandmark(6, 5),
      mockLandmark(4, 5.1),
      mockLandmark(2, 5.1),
    ];
    // EAR = (0.2 + 0.2) / (2 * 6) = 0.4 / 12 = 0.033
    expect(isEyeClosed(calculateEAR(closedEye))).toBe(true);
  });

  it('detects eye as open when EAR is above threshold', () => {
    const openEye: IFaceLandmark[] = [
      mockLandmark(0, 5),
      mockLandmark(2, 4),
      mockLandmark(4, 4),
      mockLandmark(6, 5),
      mockLandmark(4, 6),
      mockLandmark(2, 6),
    ];
    // EAR = 0.333
    expect(isEyeClosed(calculateEAR(openEye))).toBe(false);
  });
});

describe('detectBlink', () => {
  let blinkState = {
    hasClosed: false,
    lastTimestamp: 0,
  };

  beforeEach(() => {
    blinkState = {
      hasClosed: false,
      lastTimestamp: 0,
    };
  });

  it('returns true when eyes go from open to closed to open', () => {
    const openEAR = 0.35;
    const closedEAR = 0.15;
    const now = Date.now();

    // Start Open
    let result = detectBlink(openEAR, openEAR, blinkState, now);
    expect(result).toBe(false);
    expect(blinkState.hasClosed).toBe(false);

    // Close eyes
    result = detectBlink(closedEAR, closedEAR, blinkState, now + 100);
    expect(result).toBe(false);
    expect(blinkState.hasClosed).toBe(true);

    // Open eyes again
    result = detectBlink(openEAR, openEAR, blinkState, now + 200);
    expect(result).toBe(true);
    expect(blinkState.hasClosed).toBe(false);
  });

  it('does not return true if only one eye is closed', () => {
    const openEAR = 0.35;
    const closedEAR = 0.15;
    const now = Date.now();

    // Left eye closed, right eye open
    let result = detectBlink(closedEAR, openEAR, blinkState, now);
    expect(result).toBe(false);
    expect(blinkState.hasClosed).toBe(false);
  });

  it('resets if the blink takes too long (> 1000ms)', () => {
    const openEAR = 0.35;
    const closedEAR = 0.15;
    const now = Date.now();

    // Close eyes
    detectBlink(closedEAR, closedEAR, blinkState, now);
    expect(blinkState.hasClosed).toBe(true);

    // Open eyes after 1.1 seconds
    const result = detectBlink(openEAR, openEAR, blinkState, now + 1100);
    expect(result).toBe(false);
    expect(blinkState.hasClosed).toBe(false);
  });
});

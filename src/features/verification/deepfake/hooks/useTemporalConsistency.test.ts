import { renderHook } from '@testing-library/react-native';
import { useTemporalConsistency } from './useTemporalConsistency';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn((val: any) => ({ value: val })),
    useDerivedValue: jest.fn((cb: any) => ({
      get value() {
        return cb();
      },
    })),
  };
});

describe('useTemporalConsistency', () => {
  it('should return high consistency if highlights change naturally with head movement', () => {
    const { result } = renderHook(() => useTemporalConsistency());

    // Simulate 5 frames of natural movement
    const frames = [
      { yaw: 0, highlights: 100 },
      { yaw: 5, highlights: 110 },
      { yaw: 10, highlights: 125 },
      { yaw: 15, highlights: 140 },
      { yaw: 20, highlights: 160 },
    ];

    let score = 0;
    frames.forEach(f => {
      score = result.current.analyzeFrame(f.yaw, f.highlights);
    });

    expect(score).toBeGreaterThan(0.7);
  });

  it('should detect frozen highlights (low consistency)', () => {
    const { result } = renderHook(() => useTemporalConsistency());

    // Head moves but highlights stay same (static/baked-in)
    const frames = [
      { yaw: 0, highlights: 100 },
      { yaw: 5, highlights: 100 },
      { yaw: 10, highlights: 100 },
      { yaw: 15, highlights: 100 },
      { yaw: 20, highlights: 100 },
    ];

    let score = 0;
    frames.forEach(f => {
      score = result.current.analyzeFrame(f.yaw, f.highlights);
    });

    expect(score).toBeLessThan(0.3);
  });

  it('should detect ghosting artifacts (low score)', () => {
    const { result } = renderHook(() => useTemporalConsistency());

    // Head moves, and we have high edge variance/artifacts (ghosting)
    const frames = [
      { yaw: 0, highlights: 100, edgeVariance: 50 },
      { yaw: 5, highlights: 110, edgeVariance: 60 },
      { yaw: 10, highlights: 125, edgeVariance: 55 },
      { yaw: 15, highlights: 140, edgeVariance: 65 },
      { yaw: 20, highlights: 160, edgeVariance: 70 },
    ];

    let score = 0;
    frames.forEach(f => {
      score = result.current.analyzeFrame(f.yaw, f.highlights, f.edgeVariance);
    });

    expect(score).toBeLessThan(0.5);
  });
});

import { renderHook } from '@testing-library/react-native';
import { useUserGuidance } from './useUserGuidance';
import { makeMutable } from 'react-native-reanimated';

describe('useUserGuidance', () => {
  it('returns "Move closer" when face width is less than 30% of screen width', () => {
    const face = makeMutable({
      bounds: { top: 0, left: 0, width: 25, height: 25 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => useUserGuidance(face as any, frameDimensions as any));
    
    expect(result.current.guidance.value).toBe('Move closer');
  });

  it('returns "Center your face" when face is more than 20% away from center', () => {
    // Face width 40% (ok), but left is 0, so center is 20% (center of frame is 50%)
    // Offset = |20 - 50| = 30% (threshold 20%)
    const face = makeMutable({
      bounds: { top: 0, left: 0, width: 40, height: 40 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => useUserGuidance(face as any, frameDimensions as any));
    
    expect(result.current.guidance.value).toBe('Center your face');
  });

  it('returns "Perfect, stay still" when face is centered and correct size', () => {
    // Face width 40% (ok), left 30% -> center 50% (ok)
    // Top 30% -> center 50% (ok)
    const face = makeMutable({
      bounds: { top: 30, left: 30, width: 40, height: 40 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => useUserGuidance(face as any, frameDimensions as any));
    
    expect(result.current.guidance.value).toBe('Perfect, stay still');
  });

  it('returns empty when no face is present', () => {
    const face = makeMutable(null);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => useUserGuidance(face as any, frameDimensions as any));
    
    expect(result.current.guidance.value).toBe('');
  });
});

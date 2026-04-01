import { renderHook } from '@testing-library/react-native';
import { useUserGuidance } from './useUserGuidance';
import { makeMutable } from 'react-native-reanimated';
import { LivenessState } from '../../verification/liveness/useLivenessMachine';

describe('useUserGuidance', () => {
  it('returns challenge instructions when in challenge state', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.CHALLENGE_BLINK)
    );
    
    expect(result.current.guidance.value).toBe('Blink your eyes');
  });

  it('returns "Move closer" when face width is less than 30% of screen width', () => {
    const face = makeMutable({
      bounds: { top: 0, left: 0, width: 25, height: 25 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.POSITIONING)
    );
    
    expect(result.current.guidance.value).toBe('Move closer');
  });

  it('returns "Center your face" when face is more than 20% away from center', () => {
    const face = makeMutable({
      bounds: { top: 0, left: 0, width: 40, height: 40 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.POSITIONING)
    );
    
    expect(result.current.guidance.value).toBe('Center your face');
  });

  it('returns "Perfect, stay still" when face is centered and correct size', () => {
    const face = makeMutable({
      bounds: { top: 30, left: 30, width: 40, height: 40 },
      landmarks: {},
      rollAngle: 0,
      pitchAngle: 0,
      yawAngle: 0,
    });
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.POSITIONING)
    );
    
    expect(result.current.guidance.value).toBe('Perfect, stay still');
  });

  it('returns position prompt when no face is present in POSITIONING', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(false);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.POSITIONING)
    );
    
    expect(result.current.guidance.value).toBe('Position your face in the guide');
  });

  it('returns "Low light - move to a brighter area" when isLowLight is true', () => {
    const face = makeMutable(null);
    const isLowLight = makeMutable(true);
    const frameDimensions = makeMutable({ width: 100, height: 100 });
    
    const { result } = renderHook(() => 
      useUserGuidance(face as any, isLowLight, frameDimensions as any, LivenessState.POSITIONING)
    );
    
    expect(result.current.guidance.value).toBe('Low light - move to a brighter area');
  });
});

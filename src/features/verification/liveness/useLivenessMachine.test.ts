import { renderHook, act } from '@testing-library/react-native';
import { useLivenessMachine, LivenessState } from './useLivenessMachine';

// Improve mock to handle useAnimatedReaction properly
let validPositionCallback: ((val: any, prev: any) => void) | null = null;
let faceCallback: ((val: any, prev: any) => void) | null = null;

jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: (val: any) => ({ value: val }),
    useAnimatedReaction: (prepare: any, react: any) => {
      // Very simple mock to distinguish between the two reactions in the hook
      const initialVal = prepare();
      if (typeof initialVal === 'boolean') {
        validPositionCallback = react;
      } else {
        faceCallback = react;
      }
    },
    runOnJS: (fn: any) => fn,
  };
});

describe('useLivenessMachine', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    validPositionCallback = null;
    faceCallback = null;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const createMockSharedValue = (initial: any) => ({ value: initial });

  const setupToBlinkChallenge = () => {
    const validPosition = createMockSharedValue(false);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });

    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });

    return { result, validPosition, face };
  };

  const setupToRotationChallenge = () => {
    const { result, validPosition, face } = setupToBlinkChallenge();
    act(() => {
      result.current.nextChallenge(); // Blink -> Smile
    });
    act(() => {
      result.current.nextChallenge(); // Smile -> Rotation
    });
    return { result, validPosition, face };
  };

  it('starts in INITIALIZING state and transitions to POSITIONING', () => {
    const validPosition = createMockSharedValue(false);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));
    
    expect(result.current.state).toBe(LivenessState.INITIALIZING);

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.state).toBe(LivenessState.POSITIONING);
  });

  it('fails if blink challenge is not met within 5 seconds', () => {
    const { result } = setupToBlinkChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
  });

  it('transitions to CHALLENGE_SMILE after successful blink', () => {
    const { result } = setupToBlinkChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    const openEAR = 0.35;
    const closedEAR = 0.15;

    // Generate 16-point contours for the machine to extract 6 points
    const createMock16PointEye = (ear: number): any[] => {
      // Very simple mock: extractEARPoints uses indices 0, 2, 6, 8, 10, 14
      // We just need to make sure the calculated EAR matches our target
      // EAR = (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4))
      const points = new Array(16).fill({ x: 0, y: 0 });
      // p1: 0, p4: 8 (Horizontal)
      points[0] = { x: 0, y: 5 };
      points[8] = { x: 6, y: 5 }; // dist = 6
      // p2: 2, p6: 14 (Vertical 1)
      // p3: 6, p5: 10 (Vertical 2)
      // For EAR = 0.333, (v1+v2)/(2*6) = 0.333 => v1+v2 = 4 => v1=2, v2=2
      // dist(p2, p6) = 2v. So 4v / 12 = ear => v = 3 * ear
      const v = (ear * 6) / 2; // half of each vertical distance
      points[2] = { x: 2, y: 5 - v };
      points[14] = { x: 2, y: 5 + v };
      points[6] = { x: 4, y: 5 - v };
      points[10] = { x: 4, y: 5 + v };
      return points;
    };

    // Close eyes
    act(() => {
      if (faceCallback) {
        faceCallback({
          contours: {
            LEFT_EYE: createMock16PointEye(closedEAR),
            RIGHT_EYE: createMock16PointEye(closedEAR),
          },
          yawAngle: 0,
          pitchAngle: 0,
        }, null);
      }
    });

    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    // Open eyes
    act(() => {
      if (faceCallback) {
        faceCallback({
          contours: {
            LEFT_EYE: createMock16PointEye(openEAR),
            RIGHT_EYE: createMock16PointEye(openEAR),
          },
          yawAngle: 0,
          pitchAngle: 0,
        }, null);
      }
    });

    expect(result.current.state).toBe(LivenessState.CHALLENGE_SMILE);
  });

  it('transitions to CHALLENGE_PITCH after successful rotation', () => {
    const { result } = setupToRotationChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    // Turn head (Yaw > 20)
    // We need 5 frames because of smoothing
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 25, pitchAngle: 0, contours: {} }, null);
      });
    }

    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);
  });

  it('fails if temporal inconsistency is detected (abrupt movement)', () => {
    const { result } = setupToRotationChallenge();
    
    // Previous yaw = 0, current yaw = 45 (> 40 diff)
    act(() => {
      if (faceCallback) faceCallback({ yawAngle: 45, pitchAngle: 0, contours: {} }, { yawAngle: 0 });
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
  });

  it('transitions to ANALYZING after successful pitch', () => {
    const { result } = setupToRotationChallenge();
    act(() => {
      result.current.nextChallenge(); // Rotation -> Pitch
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);

    // Tilt head (Pitch > 15)
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 0, pitchAngle: 20, contours: {} }, null);
      });
    }

    expect(result.current.state).toBe(LivenessState.ANALYZING);
  });

  it('transitions through all challenges and to ANALYZING', () => {
    const { result } = setupToBlinkChallenge();
    
    act(() => {
      result.current.nextChallenge(); // To SMILE
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_SMILE);

    act(() => {
      result.current.nextChallenge(); // To ROTATION
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    act(() => {
      result.current.nextChallenge(); // To PITCH
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);

    act(() => {
      result.current.nextChallenge(); // To ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);
  });

  it('transitions to SUCCESS when complete is called', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    act(() => {
      result.current.complete();
    });

    expect(result.current.state).toBe(LivenessState.SUCCESS);
  });

  it('transitions to FAILURE when fail is called', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    act(() => {
      result.current.fail();
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
  });

  it('completes successfully if passive texture analysis is high', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    // Fast track to ANALYZING
    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });

    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });

    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 5 high-quality frames (real face)
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (faceCallback) {
          faceCallback(
            {
              yawAngle: 0,
              pitchAngle: 0,
              textureAnalysis: { variance: 15, moireDetected: false },
            },
            null,
          );
        }
      });
    }

    expect(result.current.state).toBe(LivenessState.SUCCESS);
  });

  it('fails if passive texture analysis detects Moire patterns', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    // Fast track to ANALYZING
    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });

    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });

    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 5 frames with Moire detection
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (faceCallback) {
          faceCallback(
            {
              yawAngle: 0,
              pitchAngle: 0,
              textureAnalysis: { variance: 2, moireDetected: true },
            },
            null,
          );
        }
      });
    }

    expect(result.current.state).toBe(LivenessState.FAILURE);
  });

  it('resets to POSITIONING and clears buffer if face is lost during ANALYZING', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    // Move to ANALYZING
    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });
    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 2 frames
    act(() => {
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
    });

    // Lose position
    act(() => {
      if (validPositionCallback) validPositionCallback(false, true);
    });

    expect(result.current.state).toBe(LivenessState.POSITIONING);

    // Re-gain position and go back to ANALYZING
    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });

    // Provide 3 frames. If buffer was NOT cleared, it would have 2+3=5 frames and finish.
    act(() => {
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
    });

    // Should still be in ANALYZING if buffer was cleared (it needs 2 more)
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide last 2 frames
    act(() => {
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
    });

    expect(result.current.state).toBe(LivenessState.SUCCESS);
  });

  it('collects exactly 5 keyframes and clears buffer after processing', () => {
    const { result } = setupToBlinkChallenge();
    
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 4 frames
    for (let i = 0; i < 4; i++) {
      act(() => {
        if (faceCallback) {
          faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
        }
      });
    }
    expect(result.current.state).toBe(LivenessState.ANALYZING); // Not done yet

    // Provide 5th frame
    act(() => {
      if (faceCallback) {
        faceCallback({ textureAnalysis: { variance: 15, moireDetected: false } }, null);
      }
    });
    expect(result.current.state).toBe(LivenessState.SUCCESS);

    // If we call faceCallback again, it should NOT trigger another state change immediately 
    // (it should start collecting from 0 again)
    // Actually, state is SUCCESS, so it shouldn't do anything.
  });

  it('resets movement history if face is lost during movement challenge', () => {
    const { result, validPosition } = setupToRotationChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    // Provide 3 frames with rotation
    for (let i = 0; i < 3; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 25, pitchAngle: 0, contours: {} }, null);
      });
    }

    // Lose position
    act(() => {
      if (validPositionCallback) validPositionCallback(false, true);
    });
    expect(result.current.state).toBe(LivenessState.POSITIONING);

    // Regain position and go back to rotation
    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });
    act(() => {
      result.current.nextChallenge(); // Blink -> Smile
    });
    act(() => {
      result.current.nextChallenge(); // Smile -> Rotation
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    // Provide 2 more frames. If history was NOT cleared, it would have 3+2=5 frames and finish.
    for (let i = 0; i < 2; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 25, pitchAngle: 0, contours: {} }, null);
      });
    }

    // Should still be in CHALLENGE_ROTATION if history was cleared (it needs 5)
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    // Provide 3 more frames
    for (let i = 0; i < 3; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 25, pitchAngle: 0, contours: {} }, null);
      });
    }
    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);
  });

  it('returns a progress value that increases with challenges', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });
    // @ts-ignore
    expect(result.current.progress).toBe(0);

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });
    // @ts-ignore
    expect(result.current.progress).toBe(0);

    act(() => {
      result.current.nextChallenge(); // Blink -> Smile
    });
    // @ts-ignore
    expect(result.current.progress).toBe(0.25);

    act(() => {
      result.current.nextChallenge(); // Smile -> Rotation
    });
    // @ts-ignore
    expect(result.current.progress).toBe(0.5);

    act(() => {
      result.current.nextChallenge(); // Rotation -> Pitch
    });
    // @ts-ignore
    expect(result.current.progress).toBe(0.75);

    act(() => {
      result.current.nextChallenge(); // Pitch -> ANALYZING
    });
    // @ts-ignore
    expect(result.current.progress).toBe(1);
  });
});
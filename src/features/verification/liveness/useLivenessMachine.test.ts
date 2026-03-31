import { renderHook, act } from '@testing-library/react-native';
import { useLivenessMachine, LivenessState } from './useLivenessMachine';
import { verifyIdentity } from '../verification-service';

const mockDispatchAction = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatchAction,
}));

jest.mock('../verification-service', () => ({
  verifyIdentity: jest.fn(),
}));

jest.mock('react-native', () => ({
  Vibration: {
    vibrate: jest.fn(),
  },
}));

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
    mockDispatchAction.mockClear();
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
    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: { status: 'FAILURE' }
    }));
  });

  it('transitions to CHALLENGE_SMILE after successful blink', () => {
    const { result } = setupToBlinkChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    const openEAR = 0.35;
    const closedEAR = 0.15;

    // Generate 16-point contours for the machine to extract 6 points
    const createMock16PointEye = (ear: number): any[] => {
      const points = new Array(16).fill({ x: 0, y: 0 });
      points[0] = { x: 0, y: 5 };
      points[8] = { x: 6, y: 5 }; // dist = 6
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
    for (let i = 0; i < 5; i++) {
      act(() => {
        if (faceCallback) faceCallback({ yawAngle: 25, pitchAngle: 0, contours: {} }, null);
      });
    }

    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);
  });

  it('fails with SECURITY_RISK if temporal inconsistency is detected (abrupt movement)', () => {
    const { result } = setupToRotationChallenge();
    
    // Previous yaw = 0, current yaw = 45 (> 40 diff)
    act(() => {
      if (faceCallback) faceCallback({ yawAngle: 45, pitchAngle: 0, contours: {} }, { yawAngle: 0 });
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: { status: 'SECURITY_RISK' }
    }));
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

  it('completes successfully if passive texture analysis is high', async () => {
    (verifyIdentity as jest.Mock).mockResolvedValue({
      status: 'SUCCESS',
      message: 'Verification Success',
      similarity: 0.95,
    });

    const { result } = setupToBlinkChallenge();
    
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 4 high-quality frames
    for (let i = 0; i < 4; i++) {
      act(() => {
        if (faceCallback) {
          faceCallback(
            {
              yawAngle: 0,
              pitchAngle: 0,
              textureAnalysis: { variance: 15, moireDetected: false },
              deepfakeScore: 0.1,
            },
            null,
          );
        }
      });
    }

    // Fifth frame triggers verifyIdentity
    await act(async () => {
      if (faceCallback) {
        faceCallback(
          {
            yawAngle: 0,
            pitchAngle: 0,
            textureAnalysis: { variance: 15, moireDetected: false },
            deepfakeScore: 0.1,
            embedding: new Float32Array(128).fill(0.1),
          },
          null,
        );
      }
    });

    expect(result.current.state).toBe(LivenessState.SUCCESS);
    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: expect.objectContaining({ status: 'SUCCESS', deepfakeScore: 0.1 })
    }));
  });

  it('fails with SECURITY_RISK if deepfake score is high during ANALYZING', () => {
    const { result } = setupToBlinkChallenge();
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    act(() => {
      if (faceCallback) {
        faceCallback({ 
          deepfakeScore: 0.9, 
          textureAnalysis: { variance: 15, moireDetected: false } 
        }, null);
      }
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: { status: 'SECURITY_RISK', deepfakeScore: 0.9 }
    }));
  });

  it('resets to POSITIONING and clears buffer if face is lost during ANALYZING', () => {
    const { result } = setupToBlinkChallenge();
    act(() => {
      result.current.nextChallenge(); // Smile
      result.current.nextChallenge(); // Rotation
      result.current.nextChallenge(); // Pitch
      result.current.nextChallenge(); // ANALYZING
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);

    // Provide 2 frames
    act(() => {
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false }, deepfakeScore: 0.1 }, null);
      if (faceCallback) faceCallback({ textureAnalysis: { variance: 15, moireDetected: false }, deepfakeScore: 0.1 }, null);
    });

    // Lose position
    act(() => {
      if (validPositionCallback) validPositionCallback(false, true);
    });

    expect(result.current.state).toBe(LivenessState.POSITIONING);
  });

  it('returns a progress value that increases with challenges', () => {
    const validPosition = createMockSharedValue(true);
    const face = createMockSharedValue(null);
    const { result } = renderHook(() => useLivenessMachine(validPosition as any, face as any));

    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });
    expect(result.current.progress).toBe(0);

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    act(() => {
      jest.advanceTimersByTime(1500); // To CHALLENGE_BLINK
    });
    expect(result.current.progress).toBe(0);

    act(() => {
      result.current.nextChallenge(); // Blink -> Smile
    });
    expect(result.current.progress).toBe(0.25);

    act(() => {
      result.current.nextChallenge(); // Smile -> Rotation
    });
    expect(result.current.progress).toBe(0.5);

    act(() => {
      result.current.nextChallenge(); // Rotation -> Pitch
    });
    expect(result.current.progress).toBe(0.75);

    act(() => {
      result.current.nextChallenge(); // Pitch -> ANALYZING
    });
    expect(result.current.progress).toBe(1);
  });
});

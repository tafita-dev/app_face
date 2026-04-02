import { renderHook, act } from '@testing-library/react-native';
import { useLivenessMachine } from './useLivenessMachine';
import { LivenessState } from './types';
import { verifyIdentity } from '../verification-service';
import { ChallengeOrchestrator } from './challenge-orchestrator';

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

// Mock ChallengeOrchestrator to return a predictable sequence for testing
jest.mock('./challenge-orchestrator', () => {
  return {
    ChallengeOrchestrator: {
      generateSequence: jest.fn().mockImplementation(() => [
        'CHALLENGE_BLINK',
        'CHALLENGE_SMILE',
        'CHALLENGE_ROTATION',
        'CHALLENGE_PITCH',
      ]),
    },
  };
});

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

  const setupToFirstChallenge = () => {
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
      jest.advanceTimersByTime(1500); // To first challenge
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

  it('generates a randomized sequence from ChallengeOrchestrator when starting', () => {
    setupToFirstChallenge();
    expect(ChallengeOrchestrator.generateSequence).toHaveBeenCalled();
  });

  it('fails if challenge is not met within 5 seconds', () => {
    const { result } = setupToFirstChallenge();
    // In our mock sequence, first is BLINK
    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(result.current.state).toBe(LivenessState.FAILURE);
    expect(mockDispatchAction).toHaveBeenCalledWith(expect.objectContaining({
      payload: { status: 'FAILURE' }
    }));
  });

  it('transitions through the sequence correctly', () => {
    const { result } = setupToFirstChallenge();
    expect(result.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    act(() => {
      result.current.nextChallenge();
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_SMILE);

    act(() => {
      result.current.nextChallenge();
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    act(() => {
      result.current.nextChallenge();
    });
    expect(result.current.state).toBe(LivenessState.CHALLENGE_PITCH);

    act(() => {
      result.current.nextChallenge();
    });
    expect(result.current.state).toBe(LivenessState.ANALYZING);
  });

  it('injects ROTATION challenge if deepfakeScore becomes suspicious', () => {
    // Our mock sequence: [BLINK, SMILE]
    // Let's change the mock to not include ROTATION initially
    (ChallengeOrchestrator.generateSequence as jest.Mock).mockReturnValue([
      LivenessState.CHALLENGE_BLINK,
      LivenessState.CHALLENGE_SMILE,
    ]);

    const validPos = createMockSharedValue(false);
    const faceValue = createMockSharedValue(null);
    const { result: newResult } = renderHook(() => useLivenessMachine(validPos as any, faceValue as any));

    act(() => {
      jest.advanceTimersByTime(100); // To POSITIONING
    });

    act(() => {
      if (validPositionCallback) validPositionCallback(true, false);
    });
    
    act(() => { jest.advanceTimersByTime(1500); }); // To BLINK
    expect(newResult.current.state).toBe(LivenessState.CHALLENGE_BLINK);

    // Deepfake score 0.6 (suspicious)
    act(() => {
      if (faceCallback) faceCallback({ deepfakeScore: 0.6, yawAngle: 0, pitchAngle: 0, contours: {} }, null);
    });

    // It should have appended ROTATION to the sequence
    act(() => {
      newResult.current.nextChallenge(); // Blink -> Smile
    });
    expect(newResult.current.state).toBe(LivenessState.CHALLENGE_SMILE);
    
    act(() => {
      newResult.current.nextChallenge(); // Smile -> Rotation (injected)
    });
    expect(newResult.current.state).toBe(LivenessState.CHALLENGE_ROTATION);

    act(() => {
      newResult.current.nextChallenge(); // Rotation -> ANALYZING
    });
    expect(newResult.current.state).toBe(LivenessState.ANALYZING);
  });

  it('returns a progress value based on current sequence index', () => {
    (ChallengeOrchestrator.generateSequence as jest.Mock).mockReturnValue([
      LivenessState.CHALLENGE_BLINK,
      LivenessState.CHALLENGE_SMILE,
      LivenessState.CHALLENGE_ROTATION,
      LivenessState.CHALLENGE_PITCH,
    ]);
    const { result } = setupToFirstChallenge();
    // Index 0 of 5 steps (4 challenges + 1 analysis)
    expect(result.current.progress).toBe(0);

    act(() => {
      result.current.nextChallenge(); // Blink -> Smile (index 1)
    });
    expect(result.current.progress).toBe(0.2);

    act(() => {
      result.current.nextChallenge(); // Smile -> Rotation (index 2)
    });
    expect(result.current.progress).toBe(0.4);

    act(() => {
      result.current.nextChallenge(); // Rotation -> Pitch (index 3)
    });
    expect(result.current.progress).toBe(0.6);

    act(() => {
      result.current.nextChallenge(); // Pitch -> ANALYZING
    });
    expect(result.current.progress).toBe(1);
  });
});

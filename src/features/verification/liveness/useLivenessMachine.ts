import { useReducer, useEffect, useCallback, useRef } from 'react';
import {
  useAnimatedReaction,
  runOnJS,
  ReadonlySharedValue,
} from 'react-native-reanimated';
import { IFaceDetection, IFaceLandmark } from '../../camera/frame-processors/types';
import { calculateEAR, detectBlink, BlinkState } from './blink-detection';
import { 
  detectRotation, 
  detectPitch, 
  checkTemporalInconsistency, 
  MovementState, 
  SMOOTHING_WINDOW_SIZE 
} from './movement-detection';
import { analyzeTexture, FrameAnalysisData } from './passive-liveness';

export enum LivenessState {
  INITIALIZING = 'INITIALIZING',
  POSITIONING = 'POSITIONING',
  CHALLENGE_BLINK = 'CHALLENGE_BLINK',
  CHALLENGE_SMILE = 'CHALLENGE_SMILE',
  CHALLENGE_ROTATION = 'CHALLENGE_ROTATION',
  CHALLENGE_PITCH = 'CHALLENGE_PITCH',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

type Action =
  | { type: 'INITIALIZE_DONE' }
  | { type: 'START_CHALLENGES' }
  | { type: 'NEXT_CHALLENGE' }
  | { type: 'RESET' }
  | { type: 'FAIL' }
  | { type: 'COMPLETE' };

interface State {
  state: LivenessState;
}

const initialState: State = {
  state: LivenessState.INITIALIZING,
};

const CHALLENGE_TIMEOUT_MS = 5000;

function livenessReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE_DONE':
      return { state: LivenessState.POSITIONING };
    case 'START_CHALLENGES':
      return { state: LivenessState.CHALLENGE_BLINK };
    case 'NEXT_CHALLENGE':
      if (state.state === LivenessState.CHALLENGE_BLINK) {
        return { state: LivenessState.CHALLENGE_SMILE };
      }
      if (state.state === LivenessState.CHALLENGE_SMILE) {
        return { state: LivenessState.CHALLENGE_ROTATION };
      }
      if (state.state === LivenessState.CHALLENGE_ROTATION) {
        return { state: LivenessState.CHALLENGE_PITCH };
      }
      if (state.state === LivenessState.CHALLENGE_PITCH) {
        return { state: LivenessState.ANALYZING };
      }
      return state;
    case 'RESET':
      return { state: LivenessState.POSITIONING };
    case 'FAIL':
      return { state: LivenessState.FAILURE };
    case 'COMPLETE':
      return { state: LivenessState.SUCCESS };
    default:
      return state;
  }
}

/**
 * Extracts 6 specific points from MLKit's 16-point eye contour loop
 * to calculate Eye Aspect Ratio (EAR).
 */
export const extractEARPoints = (contour: IFaceLandmark[]): IFaceLandmark[] => {
  if (contour.length < 16) return [];
  return [
    contour[0],  // p1 (left)
    contour[2],  // p2 (top-left)
    contour[6],  // p3 (top-right)
    contour[8],  // p4 (right)
    contour[10], // p5 (bottom-right)
    contour[14], // p6 (bottom-left)
  ];
};

export const useLivenessMachine = (
  validPosition: ReadonlySharedValue<boolean>,
  face: ReadonlySharedValue<IFaceDetection | null>,
) => {
  const [state, dispatch] = useReducer(livenessReducer, initialState);
  const stabilityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const challengeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blinkStateRef = useRef<BlinkState>({ hasClosed: false, lastTimestamp: 0 });
  const yawStateRef = useRef<MovementState>({ history: new Array(SMOOTHING_WINDOW_SIZE).fill(0), lastValue: 0 });
  const pitchStateRef = useRef<MovementState>({ history: new Array(SMOOTHING_WINDOW_SIZE).fill(0), lastValue: 0 });
  const keyframesAnalysisRef = useRef<FrameAnalysisData[]>([]);
  const REQUIRED_KEYFRAMES = 5;

  // Initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: 'INITIALIZE_DONE' });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      clearStabilityTimer();
      clearChallengeTimer();
    };
  }, [clearStabilityTimer, clearChallengeTimer]);

  const clearStabilityTimer = useCallback(() => {
    if (stabilityTimerRef.current) {
      clearTimeout(stabilityTimerRef.current);
      stabilityTimerRef.current = null;
    }
  }, []);

  const clearChallengeTimer = useCallback(() => {
    if (challengeTimerRef.current) {
      clearTimeout(challengeTimerRef.current);
      challengeTimerRef.current = null;
    }
  }, []);

  const startChallengeTimeout = useCallback(() => {
    clearChallengeTimer();
    challengeTimerRef.current = setTimeout(() => {
      dispatch({ type: 'FAIL' });
    }, CHALLENGE_TIMEOUT_MS);
  }, [clearChallengeTimer]);

  const resetChallengeStates = useCallback(() => {
    blinkStateRef.current = { hasClosed: false, lastTimestamp: 0 };
    yawStateRef.current = { history: new Array(SMOOTHING_WINDOW_SIZE).fill(0), lastValue: 0 };
    pitchStateRef.current = { history: new Array(SMOOTHING_WINDOW_SIZE).fill(0), lastValue: 0 };
    keyframesAnalysisRef.current = [];
  }, []);

  const handlePositionChange = useCallback(
    (isValid: boolean) => {
      if (state.state === LivenessState.POSITIONING) {
        if (isValid) {
          if (!stabilityTimerRef.current) {
            stabilityTimerRef.current = setTimeout(() => {
              dispatch({ type: 'START_CHALLENGES' });
              stabilityTimerRef.current = null;
              startChallengeTimeout();
            }, 1500);
          }
        } else {
          clearStabilityTimer();
        }
      } else if (state.state.startsWith('CHALLENGE_') || state.state === LivenessState.ANALYZING) {
        if (!isValid) {
          dispatch({ type: 'RESET' });
          clearChallengeTimer();
          resetChallengeStates();
        }
      }
    },
    [state.state, clearStabilityTimer, clearChallengeTimer, startChallengeTimeout, resetChallengeStates],
  );

  const handleFaceUpdate = useCallback(
    (currentFace: IFaceDetection | null, previousFace: IFaceDetection | null) => {
      if (!currentFace) return;

      // Anti-Deepfake: Abrupt movement detection
      if (previousFace) {
        const yawInconsistent = checkTemporalInconsistency(previousFace.yawAngle, currentFace.yawAngle);
        const pitchInconsistent = checkTemporalInconsistency(previousFace.pitchAngle, currentFace.pitchAngle);
        if (yawInconsistent || pitchInconsistent) {
          dispatch({ type: 'FAIL' });
          return;
        }
      }

      // Blink detection
      if (state.state === LivenessState.CHALLENGE_BLINK) {
        const leftContour = currentFace.contours?.LEFT_EYE;
        const rightContour = currentFace.contours?.RIGHT_EYE;

        if (leftContour && rightContour) {
          const leftPoints = extractEARPoints(leftContour);
          const rightPoints = extractEARPoints(rightContour);

          if (leftPoints.length === 6 && rightPoints.length === 6) {
            const leftEAR = calculateEAR(leftPoints);
            const rightEAR = calculateEAR(rightPoints);

            const isBlinkDetected = detectBlink(
              leftEAR,
              rightEAR,
              blinkStateRef.current,
              Date.now(),
            );

            if (isBlinkDetected) {
              dispatch({ type: 'NEXT_CHALLENGE' });
              startChallengeTimeout();
            }
          }
        }
      }

      // Rotation (Yaw) detection
      if (state.state === LivenessState.CHALLENGE_ROTATION) {
        if (detectRotation(currentFace.yawAngle, yawStateRef.current)) {
          dispatch({ type: 'NEXT_CHALLENGE' });
          startChallengeTimeout();
        }
      }

      // Pitch detection
      if (state.state === LivenessState.CHALLENGE_PITCH) {
        if (detectPitch(currentFace.pitchAngle, pitchStateRef.current)) {
          dispatch({ type: 'NEXT_CHALLENGE' });
          startChallengeTimeout();
        }
      }

      // Passive Texture Analysis
      if (state.state === LivenessState.ANALYZING) {
        if (currentFace.textureAnalysis) {
          keyframesAnalysisRef.current.push(currentFace.textureAnalysis);

          if (keyframesAnalysisRef.current.length >= REQUIRED_KEYFRAMES) {
            // Take exactly REQUIRED_KEYFRAMES and clear the buffer immediately to prevent double-processing or inflation
            const framesToProcess = keyframesAnalysisRef.current.slice(0, REQUIRED_KEYFRAMES);
            keyframesAnalysisRef.current = [];

            const results = framesToProcess.map(analyzeTexture);
            const averageScore = results.reduce((acc, curr) => acc + curr.livenessScore, 0) / REQUIRED_KEYFRAMES;

            if (averageScore > 0.8) {
              dispatch({ type: 'COMPLETE' });
              clearChallengeTimer();
            } else {
              // Any score below 0.8 is considered a failure for high security
              dispatch({ type: 'FAIL' });
              clearChallengeTimer();
            }
          }
        }
      }
    },
    [state.state, startChallengeTimeout, clearChallengeTimer],
  );

  useAnimatedReaction(
    () => validPosition.value,
    isValid => {
      runOnJS(handlePositionChange)(isValid);
    },
    [handlePositionChange],
  );

  useAnimatedReaction(
    () => face.value,
    (currentFace, previousFace) => {
      runOnJS(handleFaceUpdate)(currentFace, previousFace);
    },
    [handleFaceUpdate],
  );

  const nextChallenge = useCallback(() => {
    dispatch({ type: 'NEXT_CHALLENGE' });
    startChallengeTimeout();
  }, [startChallengeTimeout]);

  const fail = useCallback(() => {
    dispatch({ type: 'FAIL' });
  }, []);

  const complete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
  }, []);

  const progress = (() => {
    switch (state.state) {
      case LivenessState.CHALLENGE_BLINK:
        return 0;
      case LivenessState.CHALLENGE_SMILE:
        return 0.25;
      case LivenessState.CHALLENGE_ROTATION:
        return 0.5;
      case LivenessState.CHALLENGE_PITCH:
        return 0.75;
      case LivenessState.ANALYZING:
      case LivenessState.SUCCESS:
        return 1;
      default:
        return 0;
    }
  })();

  return {
    state: state.state,
    progress,
    nextChallenge,
    fail,
    complete,
  };
};

import { useReducer, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { Vibration } from 'react-native';
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
import { detectSmile } from './smile-detection';
import { analyzeTexture, FrameAnalysisData } from './passive-liveness';
import { setVerificationResult } from '../../../store/app-slice';
import { DeepfakeService } from '../deepfake/DeepfakeService';
import { verifyIdentity } from '../verification-service';

import { ChallengeOrchestrator, ChallengeType } from './challenge-orchestrator';
import { LivenessState } from './types';

type Action =
  | { type: 'INITIALIZE_DONE' }
  | { type: 'START_CHALLENGES'; sequence: ChallengeType[] }
  | { type: 'NEXT_CHALLENGE' }
  | { type: 'ADAPT_SEQUENCE'; sequence: ChallengeType[] }
  | { type: 'RESET' }
  | { type: 'FAIL' }
  | { type: 'COMPLETE' };

interface State {
  state: LivenessState;
  sequence: ChallengeType[];
  currentChallengeIndex: number;
}

const initialState: State = {
  state: LivenessState.INITIALIZING,
  sequence: [],
  currentChallengeIndex: -1,
};

const CHALLENGE_TIMEOUT_MS = 5000;

function livenessReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INITIALIZE_DONE':
      return { ...state, state: LivenessState.POSITIONING };
    case 'START_CHALLENGES':
      return {
        ...state,
        state: action.sequence[0],
        sequence: action.sequence,
        currentChallengeIndex: 0,
      };
    case 'NEXT_CHALLENGE':
      const nextIndex = state.currentChallengeIndex + 1;
      if (nextIndex < state.sequence.length) {
        return {
          ...state,
          state: state.sequence[nextIndex],
          currentChallengeIndex: nextIndex,
        };
      }
      return {
        ...state,
        state: LivenessState.ANALYZING,
        currentChallengeIndex: nextIndex,
      };
    case 'ADAPT_SEQUENCE':
      return {
        ...state,
        sequence: action.sequence,
      };
    case 'RESET':
      return {
        ...state,
        state: LivenessState.POSITIONING,
        sequence: [],
        currentChallengeIndex: -1,
      };
    case 'FAIL':
      return { ...state, state: LivenessState.FAILURE };
    case 'COMPLETE':
      return { ...state, state: LivenessState.SUCCESS };
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
  const dispatchAction = useDispatch();
  const [state, dispatch] = useReducer(livenessReducer, initialState);
  const sessionIdRef = useRef<string>(Math.random().toString(36).substring(2, 15));
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

  useEffect(() => {
    return () => {
      clearStabilityTimer();
      clearChallengeTimer();
    };
  }, [clearStabilityTimer, clearChallengeTimer]);

  const startChallengeTimeout = useCallback(() => {
    clearChallengeTimer();
    challengeTimerRef.current = setTimeout(() => {
      dispatch({ type: 'FAIL' });
      dispatchAction(setVerificationResult({ status: 'FAILURE' }));
    }, CHALLENGE_TIMEOUT_MS);
  }, [clearChallengeTimer, dispatchAction]);

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
              // Reset sessionId for each new attempt to ensure different sequences
              sessionIdRef.current = Math.random().toString(36).substring(2, 15);
              const sequence = ChallengeOrchestrator.generateSequence(undefined, sessionIdRef.current);
              dispatch({ type: 'START_CHALLENGES', sequence });
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

      // Adaptive Challenge Injection: If deepfake score is suspicious, inject extra challenge
      if (
        currentFace.deepfakeScore !== undefined &&
        currentFace.deepfakeScore >= 0.5 &&
        currentFace.deepfakeScore <= 0.8 &&
        !state.sequence.includes(LivenessState.CHALLENGE_ROTATION) &&
        (state.state.startsWith('CHALLENGE_') || state.state === LivenessState.POSITIONING)
      ) {
        const newSequence = [...state.sequence];
        // Inject at the end before ANALYZING
        newSequence.push(LivenessState.CHALLENGE_ROTATION);
        dispatch({ type: 'ADAPT_SEQUENCE', sequence: newSequence });
      }

      // Anti-Deepfake: Abrupt movement detection
      if (previousFace) {
        const yawInconsistent = checkTemporalInconsistency(previousFace.yawAngle, currentFace.yawAngle);
        const pitchInconsistent = checkTemporalInconsistency(previousFace.pitchAngle, currentFace.pitchAngle);
        if (yawInconsistent || pitchInconsistent) {
          dispatch({ type: 'FAIL' });
          dispatchAction(setVerificationResult({ status: 'SECURITY_RISK' }));
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

      // Smile detection
      if (state.state === LivenessState.CHALLENGE_SMILE) {
        if (currentFace.smilingProbability !== undefined && detectSmile(currentFace.smilingProbability)) {
          dispatch({ type: 'NEXT_CHALLENGE' });
          startChallengeTimeout();
        }
      }

      // Passive Texture Analysis & Deepfake check
      if (state.state === LivenessState.ANALYZING) {
        // Deepfake block logic
        if (currentFace.deepfakeScore !== undefined && DeepfakeService.isSecurityRisk(currentFace.deepfakeScore)) {
          dispatch({ type: 'FAIL' });
          dispatchAction(setVerificationResult({ 
            status: 'SECURITY_RISK', 
            deepfakeScore: currentFace.deepfakeScore 
          }));
          clearChallengeTimer();
          return;
        }

        if (currentFace.textureAnalysis) {
          keyframesAnalysisRef.current.push(currentFace.textureAnalysis);

          if (keyframesAnalysisRef.current.length >= REQUIRED_KEYFRAMES) {
            // Take exactly REQUIRED_KEYFRAMES and clear the buffer immediately to prevent double-processing or inflation
            const framesToProcess = keyframesAnalysisRef.current.slice(0, REQUIRED_KEYFRAMES);
            keyframesAnalysisRef.current = [];

            const results = framesToProcess.map(analyzeTexture);
            const averageScore = results.reduce((acc, curr) => acc + curr.livenessScore, 0) / REQUIRED_KEYFRAMES;

            if (averageScore > 0.8) {
              // Liveness & Deepfake check passed, now verify biometrics
              if (currentFace.embedding) {
                // Biometric Verification
                runOnJS(async (embedding: Float32Array, deepfakeScore?: number) => {
                  const result = await verifyIdentity(embedding);
                  if (result.status === 'SUCCESS') {
                    dispatch({ type: 'COMPLETE' });
                    Vibration.vibrate(100);
                    dispatchAction(
                      setVerificationResult({
                        status: 'SUCCESS',
                        message: result.message,
                        deepfakeScore: deepfakeScore,
                        biometricSimilarity: result.similarity,
                      }),
                    );
                  } else if (result.status === 'LOCKOUT') {
                    dispatch({ type: 'FAIL' });
                    Vibration.vibrate([0, 200, 100, 200]);
                    dispatchAction(
                      setVerificationResult({
                        status: 'LOCKOUT',
                        message: result.message,
                        lockoutRemainingTime: result.lockoutRemainingTime,
                      }),
                    );
                  } else {
                    dispatch({ type: 'FAIL' });
                    Vibration.vibrate([0, 200, 100, 200]);
                    dispatchAction(
                      setVerificationResult({
                        status: 'FAILURE',
                        message: result.message,
                        deepfakeScore: deepfakeScore,
                        biometricSimilarity: result.similarity,
                      }),
                    );
                  }
                })(currentFace.embedding, currentFace.deepfakeScore);
                clearChallengeTimer();
              } else {
                // Embedding not available yet, wait for next frame
              }
            } else {
              // Any score below 0.8 is considered a failure for high security
              dispatch({ type: 'FAIL' });
              Vibration.vibrate([0, 200, 100, 200]);
              dispatchAction(
                setVerificationResult({
                  status: 'FAILURE',
                  message: 'Liveness Check Failed',
                  deepfakeScore: currentFace.deepfakeScore,
                }),
              );
              clearChallengeTimer();
            }
          }
        }
      }
    },
    [state.state, startChallengeTimeout, clearChallengeTimer, dispatchAction],
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
    Vibration.vibrate([0, 200, 100, 200]);
    dispatchAction(setVerificationResult({ status: 'FAILURE' }));
  }, [dispatchAction]);

  const complete = useCallback(() => {
    dispatch({ type: 'COMPLETE' });
    Vibration.vibrate(100);
    dispatchAction(setVerificationResult({ status: 'SUCCESS' }));
  }, [dispatchAction]);

  const progress = (() => {
    if (state.state === LivenessState.SUCCESS) {
      return 1;
    }
    if (state.currentChallengeIndex === -1 || state.sequence.length === 0) {
      return 0;
    }
    if (state.state === LivenessState.ANALYZING) {
      return 1;
    }
    // (Completed challenges) / (Total challenges + 1 for analysis)
    return state.currentChallengeIndex / (state.sequence.length + 1);
  })();

  return {
    state: state.state,
    progress,
    nextChallenge,
    fail,
    complete,
  };
};

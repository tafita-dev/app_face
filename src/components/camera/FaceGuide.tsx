import React, { useState, useEffect } from 'react';
import { Canvas, Rect, Circle, Oval } from '@shopify/react-native-skia';
import { StyleSheet, View, useWindowDimensions, Text } from 'react-native';
import { SharedValue, useDerivedValue, runOnJS, useSharedValue, withRepeat, withTiming, withSequence, useAnimatedReaction } from 'react-native-reanimated';

import { IFaceDetection } from '../../features/camera/frame-processors/types';
import { COLORS } from '../../theme';
import { useUserGuidance } from '../../features/camera/hooks/useUserGuidance';
import { LivenessState } from '../../features/verification/liveness/useLivenessMachine';

interface FaceGuideProps {
  face: SharedValue<IFaceDetection | null>;
  frameDimensions: SharedValue<{ width: number; height: number }>;
  livenessState: LivenessState;
  testID?: string;
}

export const FaceGuide: React.FC<FaceGuideProps> = ({
  face,
  frameDimensions,
  livenessState,
  testID = 'face-guide',
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { guidance } = useUserGuidance(face, frameDimensions, livenessState);
  
  const pulse = useSharedValue(1);

  // ✅ React states (safe for render)
  const [rect, setRect] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [text, setText] = useState('');

  // Pulse effect for ANALYZING
  useEffect(() => {
    if (livenessState === LivenessState.ANALYZING) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(0.4, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [livenessState, pulse]);

  const animatedOpacity = useDerivedValue(() => {
    if (livenessState === LivenessState.ANALYZING) {
      return pulse.value;
    }
    return 0.3;
  });

  // 🟢 Guide color logic
  const guideColor = (() => {
    switch (livenessState) {
      case LivenessState.INITIALIZING:
      case LivenessState.POSITIONING:
        return COLORS.PRIMARY;
      case LivenessState.CHALLENGE_BLINK:
      case LivenessState.CHALLENGE_SMILE:
      case LivenessState.CHALLENGE_ROTATION:
      case LivenessState.CHALLENGE_PITCH:
        return COLORS.SUCCESS;
      case LivenessState.ANALYZING:
        return COLORS.SUCCESS; // Could mix with Blue if needed
      case LivenessState.SUCCESS:
        return COLORS.SUCCESS;
      case LivenessState.FAILURE:
        return COLORS.ERROR;
      default:
        return COLORS.PRIMARY;
    }
  })();

  // ✅ Mapping + sync UI thread → JS thread
  useAnimatedReaction(
    () => {
      if (
        !face.value ||
        frameDimensions.value.width === 0 ||
        frameDimensions.value.height === 0
      ) {
        return { rect: { x: 0, y: 0, width: 0, height: 0 }, points: [] };
      }

      const scaleX = screenWidth / frameDimensions.value.width;
      const scaleY = screenHeight / frameDimensions.value.height;

      const { bounds, landmarks } = face.value;

      const mappedRect = {
        x: bounds.left * scaleX,
        y: bounds.top * scaleY,
        width: bounds.width * scaleX,
        height: bounds.height * scaleY,
      };

      const mappedPoints = [
        landmarks.leftEye,
        landmarks.rightEye,
        landmarks.noseBase,
        landmarks.mouthBottom,
        landmarks.mouthLeft,
        landmarks.mouthRight,
      ]
        .filter(Boolean)
        .map(p => ({
          x: p!.x * scaleX,
          y: p!.y * scaleY,
        }));

      return { rect: mappedRect, points: mappedPoints };
    },
    (result) => {
      runOnJS(setRect)(result.rect);
      runOnJS(setPoints)(result.points);
    }
  );

  // ✅ Guidance text sync
  useAnimatedReaction(
    () => guidance.value,
    (val) => {
      runOnJS(setText)(val);
    }
  );

  return (
    <View style={StyleSheet.absoluteFill} testID={testID} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* 🟢 Guide ovale */}
        <Oval
          rect={{
            x: screenWidth * 0.1,
            y: screenHeight * 0.2,
            width: screenWidth * 0.8,
            height: screenHeight * 0.5,
          }}
          style="stroke"
          strokeWidth={2}
          color={guideColor}
          opacity={animatedOpacity}
        />

        {/* 🟩 Bounding Box */}
        {rect.width > 0 && (
          <Rect
            rect={rect}
            style="stroke"
            strokeWidth={2}
            color={guideColor}
          />
        )}

        {/* 🟡 Landmarks */}
        {points.map((point, index) => (
          <Circle key={index} cx={point.x} cy={point.y} r={3} color="#FFD700" />
        ))}
      </Canvas>

      {/* 🧠 Guidance Text */}
      <View style={styles.guidanceContainer}>
        <Text style={styles.guidanceText} testID="guidance-text">{text}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  guidanceContainer: {
    position: 'absolute',
    bottom: '10%',
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  guidanceText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
});

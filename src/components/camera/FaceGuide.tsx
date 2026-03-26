import React from 'react';
import { Canvas, Rect, Circle, Oval } from '@shopify/react-native-skia';
import { StyleSheet, View, useWindowDimensions, Text } from 'react-native';
import Animated, { SharedValue, useDerivedValue, useAnimatedProps } from 'react-native-reanimated';
import { IFaceDetection } from '../../features/camera/frame-processors/types';
import { COLORS } from '../../theme';
import { useUserGuidance } from '../../features/camera/hooks/useUserGuidance';

interface FaceGuideProps {
  face: SharedValue<IFaceDetection | null>;
  frameDimensions: SharedValue<{ width: number; height: number }>;
  testID?: string;
}

const AnimatedText = Animated.createAnimatedComponent(Text);

export const FaceGuide: React.FC<FaceGuideProps> = ({ 
  face, 
  frameDimensions,
  testID = 'face-guide' 
}) => {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { guidance } = useUserGuidance(face, frameDimensions);

  // Mapping logic: map native camera coordinates to screen coordinates
  const derivedFace = useDerivedValue(() => {
    if (!face.value || frameDimensions.value.width === 0 || frameDimensions.value.height === 0) {
      return null;
    }

    const scaleX = screenWidth / frameDimensions.value.width;
    const scaleY = screenHeight / frameDimensions.value.height;

    // ML Kit coordinate system (native camera)
    const { bounds, landmarks } = face.value;

    return {
      rect: {
        x: bounds.left * scaleX,
        y: bounds.top * scaleY,
        width: bounds.width * scaleX,
        height: bounds.height * scaleY,
      },
      landmarks: {
        leftEye: landmarks.leftEye ? { x: landmarks.leftEye.x * scaleX, y: landmarks.leftEye.y * scaleY } : undefined,
        rightEye: landmarks.rightEye ? { x: landmarks.rightEye.x * scaleX, y: landmarks.rightEye.y * scaleY } : undefined,
        noseBase: landmarks.noseBase ? { x: landmarks.noseBase.x * scaleX, y: landmarks.noseBase.y * scaleY } : undefined,
        mouthBottom: landmarks.mouthBottom ? { x: landmarks.mouthBottom.x * scaleX, y: landmarks.mouthBottom.y * scaleY } : undefined,
        mouthLeft: landmarks.mouthLeft ? { x: landmarks.mouthLeft.x * scaleX, y: landmarks.mouthLeft.y * scaleY } : undefined,
        mouthRight: landmarks.mouthRight ? { x: landmarks.mouthRight.x * scaleX, y: landmarks.mouthRight.y * scaleY } : undefined,
      },
    };
  });

  const boundingBoxRect = useDerivedValue(() => {
    if (!derivedFace.value) return { x: 0, y: 0, width: 0, height: 0 };
    return derivedFace.value.rect;
  });

  const landmarksList = useDerivedValue(() => {
    if (!derivedFace.value) return [];
    const lms = derivedFace.value.landmarks;
    return [
      lms.leftEye, lms.rightEye, lms.noseBase, 
      lms.mouthBottom, lms.mouthLeft, lms.mouthRight
    ].filter(Boolean) as { x: number; y: number }[];
  });

  const animatedTextProps = useAnimatedProps(() => {
    return {
      text: guidance.value,
    } as any;
  });

  return (
    <View style={StyleSheet.absoluteFill} testID={testID} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Render persistent oval guide if needed (from Flow A requirement) */}
        <Oval
          rect={{ x: screenWidth * 0.1, y: screenHeight * 0.2, width: screenWidth * 0.8, height: screenHeight * 0.5 }}
          style="stroke"
          strokeWidth={2}
          color={COLORS.PRIMARY}
          opacity={0.3}
        />

        {/* Dynamic Bounding Box */}
        {boundingBoxRect.value.width > 0 && (
          <Rect
            rect={boundingBoxRect}
            style="stroke"
            strokeWidth={2}
            color={COLORS.SUCCESS}
          />
        )}

        {/* Dynamic Landmarks */}
        {landmarksList.value.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={3}
            color="#FFD700" // Golden/Yellow as per US
          />
        ))}
      </Canvas>

      {/* Guidance Message Overlay */}
      <View style={styles.guidanceContainer}>
        <AnimatedText 
          animatedProps={animatedTextProps}
          style={styles.guidanceText}
          testID="guidance-text"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  guidanceContainer: {
    position: 'absolute',
    top: '10%',
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

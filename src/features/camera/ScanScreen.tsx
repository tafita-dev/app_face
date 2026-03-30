import React, { useCallback } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  useDerivedValue,
} from 'react-native-reanimated';
import { CameraView } from './CameraView';
import { COLORS } from '../../theme';
import {
  useLivenessMachine,
  LivenessState,
} from '../verification/liveness/useLivenessMachine';

export const ScanScreen: React.FC = () => {
  const faceValue = useSharedValue<any>(null);
  const frameDimensionsValue = useSharedValue({ width: 0, height: 0 });
  const validPositionValue = useSharedValue(false);

  const { state, progress } = useLivenessMachine(validPositionValue, faceValue);

  const onFaceDetection = useCallback(
    (face: any, dimensions: any, validPosition: any) => {
      faceValue.value = face.value;
      frameDimensionsValue.value = dimensions.value;
      validPositionValue.value = validPosition.value;
    },
    [faceValue, frameDimensionsValue, validPositionValue],
  );

  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, { duration: 500 });
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  return (
    <View style={styles.container}>
      <CameraView livenessState={state} onFaceDetection={onFaceDetection} />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          testID="progress-bar-fill"
          style={[styles.progressBar, animatedProgressStyle]}
        />
      </View>

      {/* Status Label */}
      <View style={styles.header}>
        <Text style={styles.statusLabel}>
          {state === LivenessState.ANALYZING
            ? 'Analysing Security...'
            : 'Scanning...'}
        </Text>
      </View>

      {/* Security Badge */}
      <View style={styles.footer}>
        <Text style={styles.securityBadge}>
          🛡️ Securely processing on-device
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  progressContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    zIndex: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
  },
  header: {
    position: 'absolute',
    top: 80,
    width: '100%',
    alignItems: 'center',
  },
  statusLabel: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  securityBadge: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 12,
  },
});

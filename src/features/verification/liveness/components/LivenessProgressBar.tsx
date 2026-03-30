import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import { COLORS } from '../../../../theme';

interface LivenessProgressBarProps {
  progress: number;
}

export const LivenessProgressBar: React.FC<LivenessProgressBarProps> = ({ progress }) => {
  const { width: screenWidth } = useWindowDimensions();
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, { duration: 300 });
  }, [progress, animatedProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: (screenWidth - 40) * animatedProgress.value,
    };
  });

  return (
    <View style={styles.container} testID="progress-bar-container">
      <View style={[styles.background, { width: screenWidth - 40 }]}>
        <Animated.View 
          testID="progress-bar"
          style={[styles.fill, animatedStyle]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
    alignItems: 'center',
    marginVertical: 10,
  },
  background: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 2,
  },
});
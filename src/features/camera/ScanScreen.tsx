import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CameraView } from './CameraView';
import { COLORS } from '../../theme';

export const ScanScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <CameraView />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
});

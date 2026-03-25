import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

export const ScanScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Camera Scanning Screen (Placeholder)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
  },
});

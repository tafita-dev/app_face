import React from 'react';
import { Canvas, Oval, Paint } from '@shopify/react-native-skia';
import { StyleSheet, View } from 'react-native';

interface FaceGuideProps {
  color?: string;
  testID?: string;
}

export const FaceGuide: React.FC<FaceGuideProps> = ({ color = '#007AFF', testID = 'face-guide' }) => {
  return (
    <View style={StyleSheet.absoluteFill} testID={testID}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Oval
          rect={{ x: 50, y: 150, width: 300, height: 400 }}
          style="stroke"
          strokeWidth={4}
          color={color}
        />
      </Canvas>
    </View>
  );
};

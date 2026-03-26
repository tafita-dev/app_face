import React, { useEffect, useState } from 'react';
import { StyleSheet, AppState, AppStatus } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFaceDetection } from './hooks/useFaceDetection';
import { FaceGuide } from '../../components/camera/FaceGuide';

export const CameraView: React.FC = () => {
  const device = useCameraDevice('front');
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStatus>(AppState.currentState);
  const { frameProcessor, face, frameDimensions } = useFaceDetection();

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const isActive = isFocused && appState === 'active';

  if (!device) {
    return null;
  }

  return (
    <>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
        testID="camera-view"
      />
      <FaceGuide face={face} frameDimensions={frameDimensions} />
    </>
  );
};

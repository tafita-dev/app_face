import React, { useEffect, useState } from 'react';
import { StyleSheet, AppState, AppStateStatus } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import { useFaceDetection } from './hooks/useFaceDetection';
import { FaceGuide } from '../../components/camera/FaceGuide';
import { LivenessState } from '../verification/liveness/useLivenessMachine';
import { TensorflowModel } from 'react-native-fast-tflite';

interface CameraViewProps {
  livenessState: LivenessState;
  onFaceDetection: (face: any, dimensions: any, validPosition: any, isLowLight: any) => void;
  antiDeepfakeModel?: TensorflowModel | null;
  biometricModel?: TensorflowModel | null;
}

export const CameraView: React.FC<CameraViewProps> = ({ 
  livenessState,
  onFaceDetection,
  antiDeepfakeModel,
  biometricModel
}) => {
  const device = useCameraDevice('front');
  const isFocused = useIsFocused();
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const { frameProcessor, face, isLowLight, frameDimensions, validPosition } = useFaceDetection(
    antiDeepfakeModel,
    biometricModel
  );

  useEffect(() => {
    onFaceDetection(face, frameDimensions, validPosition, isLowLight);
  }, [face, frameDimensions, validPosition, isLowLight, onFaceDetection]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
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
      <FaceGuide 
        face={face} 
        isLowLight={isLowLight}
        frameDimensions={frameDimensions} 
        livenessState={livenessState}
      />
    </>
  );
};

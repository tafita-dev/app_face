import React, { useCallback, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/root-navigator';
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
} from '../verification/liveness/useLivenessMachine';
import { LivenessState } from '../verification/liveness/types';
import { RootState } from '../../store';
import { useAntiDeepfakeModel } from '../verification/deepfake/hooks/useAntiDeepfakeModel';
import { useBiometricModel } from '../verification/biometrics/hooks/useBiometricModel';
import { resetVerification, setDeviceStatus, setVerificationResult, SecurityContext } from '../../store/app-slice';
import { checkDeviceIntegrity, useScreenProtection, lockoutService, useAdaptiveSecurity } from '../security';

export const ScanScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const { verificationStatus, verificationMessage, securityContext } = useSelector(
    (state: RootState) => state.app,
  );
  const faceValue = useSharedValue<any>(null);
  const isLowLightValue = useSharedValue(false);
  const frameDimensionsValue = useSharedValue({ width: 0, height: 0 });
  const validPositionValue = useSharedValue(false);

  const { model: antiDeepfakeModel } = useAntiDeepfakeModel();
  const { model: biometricModel } = useBiometricModel();

  const { state, progress } = useLivenessMachine(validPositionValue, faceValue);
  const { isRecording } = useAdaptiveSecurity();

  useEffect(() => {
    if (securityContext === 'HIGH_RISK') {
      dispatch(setVerificationResult({
        status: 'SECURITY_RISK',
        message: 'Security risk detected. Access restricted.'
      }));
    }
  }, [securityContext, dispatch]);

  useEffect(() => {
    const checkLockout = async () => {
      if (await lockoutService.isLockedOut()) {
        const remaining = await lockoutService.getRemainingLockoutTime();
        dispatch(
          setVerificationResult({
            status: 'LOCKOUT',
            message: 'Too many failed attempts.',
            lockoutRemainingTime: remaining,
          }),
        );
      }
    };
    checkLockout();
  }, [dispatch]);

  useEffect(() => {
    const status = checkDeviceIntegrity();
    if (status === 'COMPROMISED') {
      dispatch(setDeviceStatus('COMPROMISED'));
      dispatch(setVerificationResult({
        status: 'SECURITY_RISK',
        message: 'Device Integrity Compromised. For your security, biometric authentication is disabled on rooted or jailbroken devices.'
      }));
    } else {
      dispatch(setDeviceStatus('SAFE'));
    }
  }, [dispatch]);

  useEffect(() => {
    if (verificationStatus === 'SECURITY_RISK' || verificationStatus === 'LOCKOUT') {
      navigation.replace('SecurityAlert');
    } else if (verificationStatus === 'SUCCESS') {
      const timer = setTimeout(() => {
        navigation.navigate('Welcome');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [verificationStatus, navigation]);

  useEffect(() => {
    return () => {
      dispatch(resetVerification());
    };
  }, [dispatch]);

  const onFaceDetection = useCallback(
    (face: any, dimensions: any, validPosition: any, isLowLight: any) => {
      faceValue.value = face.value;
      isLowLightValue.value = isLowLight.value;
      frameDimensionsValue.value = dimensions.value;
      validPositionValue.value = validPosition.value;
    },
    [faceValue, isLowLightValue, frameDimensionsValue, validPositionValue],
  );

  const animatedProgress = useDerivedValue(() => {
    return withTiming(progress, { duration: 500 });
  });

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value * 100}%`,
    };
  });

  const getStatusLabel = () => {
    if (verificationStatus === 'FAILURE' && verificationMessage) {
      return verificationMessage;
    }
    if (state === LivenessState.ANALYZING) {
      return 'Analysing Security...';
    }
    if (state === LivenessState.SUCCESS) {
      return 'Identity Verified';
    }
    if (state === LivenessState.FAILURE) {
      return 'Verification Failed';
    }
    return 'Scanning...';
  };

  return (
    <View style={styles.container}>
      <CameraView 
        livenessState={state} 
        onFaceDetection={onFaceDetection}
        antiDeepfakeModel={antiDeepfakeModel}
        biometricModel={biometricModel}
      />

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Animated.View
          testID="progress-bar-fill"
          style={[styles.progressBar, animatedProgressStyle]}
        />
      </View>

      {/* Status Label */}
      <View style={styles.header}>
        <Text style={styles.statusLabel}>{getStatusLabel()}</Text>
      </View>

      {/* Security Badge */}
      <View style={styles.footer}>
        <Text style={styles.securityBadge}>
          🛡️ Securely processing on-device
        </Text>
      </View>

      {/* Screen Recording Overlay */}
      {isRecording && (
        <View testID="recording-overlay" style={styles.recordingOverlay}>
          <View style={styles.blurContainer} />
          <View style={styles.warningContent}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>Security Risk</Text>
            <Text style={styles.warningText}>
              Screen recording detected. Please stop it to continue
            </Text>
          </View>
        </View>
      )}

      {/* Unstable Environment Overlay */}
      {securityContext === 'UNSTABLE' && (
        <View testID="unstable-overlay" style={styles.recordingOverlay}>
          <View style={styles.blurContainer} />
          <View style={styles.warningContent}>
            <Text style={styles.warningIcon}>🔋</Text>
            <Text style={styles.warningTitle}>Unstable Environment</Text>
            <Text style={styles.warningText}>
              Low battery detected. Please plug in your device for reliable verification.
            </Text>
          </View>
        </View>
      )}
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
  recordingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.BACKGROUND,
    opacity: 0.9,
  },
  warningContent: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  warningTitle: {
    color: COLORS.WARNING,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  warningText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
});

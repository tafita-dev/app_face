import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/root-navigator';
import { COLORS } from '../../../theme';
import { useDispatch, useSelector } from 'react-redux';
import { resetVerification } from '../../../store/app-slice';
import { RootState } from '../../../store';

export const SecurityAlertScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const { verificationStatus, verificationMessage, lockoutRemainingTime } =
    useSelector((state: RootState) => state.app);

  const isLockout = verificationStatus === 'LOCKOUT';

  const handleTryAgain = () => {
    dispatch(resetVerification());
    navigation.replace('Scan');
  };

  const handleContactSupport = () => {
    // In a real app, this would open support
    console.log('Contacting support...');
  };

  const getRemainingMinutes = () => {
    return Math.ceil(lockoutRemainingTime / 60000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{isLockout ? '🔒' : '⚠️'}</Text>
        <Text style={[styles.heading, isLockout && styles.lockoutHeading]}>
          {isLockout ? 'Authentication Locked' : 'Authentication Blocked'}
        </Text>
        <Text style={styles.description}>
          {isLockout
            ? `Too many failed attempts. For your security, access is temporarily restricted for ${getRemainingMinutes()} minutes.`
            : verificationMessage ||
              'A potential security risk was detected. For your safety, access is temporarily restricted.'}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleContactSupport}
        >
          <Text style={styles.primaryButtonText}>Contact Support</Text>
        </TouchableOpacity>

        {!isLockout && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleTryAgain}
          >
            <Text style={styles.secondaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}

        {isLockout && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Welcome')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
  },
  icon: {
    fontSize: 80,
    marginBottom: 20,
  },
  heading: {
    color: COLORS.ERROR,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  lockoutHeading: {
    color: COLORS.ERROR,
  },
  description: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  secondaryButtonText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 16,
  },
});

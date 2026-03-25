import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { COLORS, SPACING } from '../../theme';
import { useCameraPermissions } from '../../hooks/useCameraPermissions';
import { RootStackParamList } from '../../navigation/root-navigator';

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { status, isGranted, isDenied, requestPermission } = useCameraPermissions();

  useEffect(() => {
    if (isGranted) {
      navigation.navigate('Scan');
    }
  }, [isGranted, navigation]);

  const handleStart = async () => {
    if (isGranted) {
      navigation.navigate('Scan');
    } else {
      const newStatus = await requestPermission();
      if (newStatus === 'granted') {
        navigation.navigate('Scan');
      }
    }
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoPlaceholder}>
        <View style={styles.logoInner} />
      </View>
      <Text style={styles.title}>AureliusSecureFace</Text>
      <Text style={styles.subtitle}>Secure Biometric Intelligence</Text>

      <View style={styles.footer}>
        {isDenied ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Camera Access Required</Text>
            <Text style={styles.errorText}>
              To enroll your face, we need camera access. Please enable it in Settings.
            </Text>
            <TouchableOpacity style={styles.button} onPress={openSettings}>
              <Text style={styles.buttonText}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.button} onPress={handleStart}>
            <Text style={styles.buttonText}>Start Enrollment</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.LG,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.PRIMARY,
    marginBottom: SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 40,
    height: 40,
    backgroundColor: COLORS.BACKGROUND,
    borderRadius: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.XL,
  },
  footer: {
    width: '100%',
    marginTop: SPACING.XL,
  },
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: COLORS.TEXT_PRIMARY,
    fontSize: 18,
    fontWeight: '600',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorTitle: {
    color: COLORS.ERROR,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: SPACING.SM,
  },
  errorText: {
    color: COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: SPACING.MD,
    fontSize: 14,
  },
});

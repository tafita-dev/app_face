import * as Keychain from 'react-native-keychain';

const BIOMETRIC_TEMPLATE_KEY = 'biometric_template';

class KeychainService {
  /**
   * Saves a biometric template (embedding) securely in the Keychain.
   * @param embedding The mathematical embedding of the face.
   * @returns A boolean indicating if the operation was successful.
   */
  async saveBiometricTemplate(embedding: number[]): Promise<boolean> {
    try {
      const embeddingString = JSON.stringify(embedding);
      const result = await Keychain.setGenericPassword(
        BIOMETRIC_TEMPLATE_KEY,
        embeddingString,
        {
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
          service: 'com.aurelius.secureface.biometrics',
        }
      );
      return !!result;
    } catch (error) {
      console.error('Error saving biometric template to keychain:', error);
      return false;
    }
  }

  /**
   * Retrieves the biometric template from the Keychain.
   * Requires biometric authentication.
   * @returns The embedding as a number array, or null if not found or unauthorized.
   */
  async getBiometricTemplate(): Promise<number[] | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Authenticate to access biometrics',
        },
        service: 'com.aurelius.secureface.biometrics',
      });

      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving biometric template from keychain:', error);
      return null;
    }
  }
}

export const keychainService = new KeychainService();

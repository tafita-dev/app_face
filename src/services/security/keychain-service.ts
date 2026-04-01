import * as Keychain from 'react-native-keychain';
import {
  obfuscateEmbedding,
  deobfuscateEmbedding,
} from '../../features/security';

const BIOMETRIC_TEMPLATE_KEY = 'biometric_template';

class KeychainService {
  /**
   * Saves a biometric template (embedding) securely in the Keychain.
   * Obfuscates the data before storage.
   * @param embedding The mathematical embedding of the face (Float32Array).
   * @returns A boolean indicating if the operation was successful.
   */
  async saveBiometricTemplate(embedding: Float32Array): Promise<boolean> {
    try {
      const obfuscated = obfuscateEmbedding(embedding);
      // Convert to array for JSON serialization
      const dataToSave = Array.from(obfuscated);
      const embeddingString = JSON.stringify(dataToSave);
      
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
   * Requires biometric authentication and performs de-obfuscation.
   * @returns The embedding as a Float32Array, or null if not found or unauthorized.
   */
  async getBiometricTemplate(): Promise<Float32Array | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        authenticationPrompt: {
          title: 'Authenticate to access biometrics',
        },
        service: 'com.aurelius.secureface.biometrics',
      });

      if (credentials) {
        const obfuscatedArray = JSON.parse(credentials.password) as number[];
        const obfuscatedEmbedding = new Float32Array(obfuscatedArray);
        return deobfuscateEmbedding(obfuscatedEmbedding);
      }
      return null;
    } catch (error) {
      console.error(
        'Error retrieving biometric template from keychain:',
        error
      );
      return null;
    }
  }
}

export const keychainService = new KeychainService();

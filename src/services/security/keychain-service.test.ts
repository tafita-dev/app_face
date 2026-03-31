import * as Keychain from 'react-native-keychain';
import { keychainService } from './keychain-service';

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  ACCESS_CONTROL: {
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
  },
  ACCESSIBLE: {
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
  },
}));

describe('KeychainService', () => {
  const mockEmbedding = [0.1, 0.2, 0.3, 0.4];
  const mockEmbeddingString = JSON.stringify(mockEmbedding);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveBiometricTemplate', () => {
    it('should save the embedding stringified to the keychain', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(true);

      const result = await keychainService.saveBiometricTemplate(mockEmbedding);

      expect(result).toBe(true);
      expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
        'biometric_template',
        mockEmbeddingString,
        expect.objectContaining({
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
          service: 'com.aurelius.secureface.biometrics',
        })
      );
    });

    it('should return false if saving fails', async () => {
      (Keychain.setGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.saveBiometricTemplate(mockEmbedding);

      expect(result).toBe(false);
    });
  });

  describe('getBiometricTemplate', () => {
    it('should retrieve and parse the embedding from the keychain', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: mockEmbeddingString,
      });

      const result = await keychainService.getBiometricTemplate();

      expect(result).toEqual(mockEmbedding);
      expect(Keychain.getGenericPassword).toHaveBeenCalledWith(
        expect.objectContaining({
          authenticationPrompt: { title: 'Authenticate to access biometrics' },
          service: 'com.aurelius.secureface.biometrics',
        })
      );
    });

    it('should return null if no template is found', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

      const result = await keychainService.getBiometricTemplate();

      expect(result).toBeNull();
    });

    it('should return null if parsing fails', async () => {
      (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
        password: 'invalid-json',
      });

      const result = await keychainService.getBiometricTemplate();

      expect(result).toBeNull();
    });
  });
});

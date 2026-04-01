import { keychainService } from './keychain-service';
import * as Keychain from 'react-native-keychain';
import { obfuscateEmbedding, deobfuscateEmbedding } from '../../features/security/embedding-obfuscation';

// Mock Keychain
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET' },
  ACCESSIBLE: { WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY' },
}));

// Mock Obfuscation
jest.mock('../../features/security/embedding-obfuscation', () => ({
  obfuscateEmbedding: jest.fn((e) => e), // Passthrough by default in mock
  deobfuscateEmbedding: jest.fn((e) => e),
}));

const mockObfuscate = obfuscateEmbedding as jest.Mock;
const mockDeobfuscate = deobfuscateEmbedding as jest.Mock;

describe('KeychainService with Obfuscation', () => {
  const rawEmbedding = new Float32Array([0.1, 0.2, 0.3]);
  const obfuscatedEmbedding = new Float32Array([0.9, 0.8, 0.7]);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should obfuscate the embedding before saving', async () => {
    mockObfuscate.mockReturnValue(obfuscatedEmbedding);
    (Keychain.setGenericPassword as jest.Mock).mockResolvedValue({ service: 'test', storage: 'test' });

    await keychainService.saveBiometricTemplate(rawEmbedding);

    expect(mockObfuscate).toHaveBeenCalledWith(rawEmbedding);
    
    // Check it's saving the obfuscated version
    const savedData = (Keychain.setGenericPassword as jest.Mock).mock.calls[0][1];
    expect(savedData).toEqual(JSON.stringify(Array.from(obfuscatedEmbedding)));
  });

  it('should deobfuscate the embedding after retrieval', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      password: JSON.stringify(Array.from(obfuscatedEmbedding)),
    });
    mockDeobfuscate.mockReturnValue(rawEmbedding);

    const result = await keychainService.getBiometricTemplate();

    expect(mockDeobfuscate).toHaveBeenCalled();
    expect(result).toEqual(rawEmbedding);
  });
});

import { verifyIdentity } from './verification-service';
import { keychainService } from '../../services/security/keychain-service';
import { compareEmbeddings } from './biometrics/matching-service';
import { lockoutService } from '../security/lockout-service';

jest.mock('../../services/security/keychain-service');
jest.mock('./biometrics/matching-service');
jest.mock('../security/lockout-service');

describe('VerificationService', () => {
  const mockLiveEmbedding = new Float32Array(128).fill(0.1);
  const mockStoredEmbedding = new Float32Array(128).fill(0.1);

  beforeEach(() => {
    jest.clearAllMocks();
    (lockoutService.isLockedOut as jest.Mock).mockResolvedValue(false);
  });

  it('should return "Verification Success" when the embedding matches the stored template', async () => {
    (keychainService.getBiometricTemplate as jest.Mock).mockResolvedValue(
      mockStoredEmbedding
    );
    (compareEmbeddings as jest.Mock).mockReturnValue({
      similarity: 0.9,
      isMatch: true,
    });

    const result = await verifyIdentity(mockLiveEmbedding);

    expect(result.status).toBe('SUCCESS');
    expect(result.message).toBe('Verification Success');
    expect(compareEmbeddings).toHaveBeenCalledWith(
      mockLiveEmbedding,
      mockStoredEmbedding,
      0.85
    );
    expect(lockoutService.recordSuccess).toHaveBeenCalled();
  });

  it('should return "Face Not Recognized" when the embedding does not match', async () => {
    (keychainService.getBiometricTemplate as jest.Mock).mockResolvedValue(mockStoredEmbedding);
    (compareEmbeddings as jest.Mock).mockReturnValue({
      similarity: 0.7,
      isMatch: false,
    });

    const result = await verifyIdentity(mockLiveEmbedding);

    expect(result.status).toBe('FAILURE');
    expect(result.message).toBe('Face Not Recognized');
    expect(lockoutService.recordFailure).toHaveBeenCalled();
  });

  it('should return "LOCKOUT" when account is locked', async () => {
    (lockoutService.isLockedOut as jest.Mock).mockResolvedValue(true);
    (lockoutService.getRemainingLockoutTime as jest.Mock).mockResolvedValue(60000);

    const result = await verifyIdentity(mockLiveEmbedding);

    expect(result.status).toBe('LOCKOUT');
    expect(result.message).toContain('Account locked');
    expect(keychainService.getBiometricTemplate).not.toHaveBeenCalled();
  });

  it('should return error when no template is stored', async () => {
    (keychainService.getBiometricTemplate as jest.Mock).mockResolvedValue(null);

    const result = await verifyIdentity(mockLiveEmbedding);

    expect(result.status).toBe('ERROR');
    expect(result.message).toBe('No enrollment found');
  });

  it('should return error when keychain fails', async () => {
    (keychainService.getBiometricTemplate as jest.Mock).mockRejectedValue(new Error('Keychain Error'));

    const result = await verifyIdentity(mockLiveEmbedding);

    expect(result.status).toBe('ERROR');
    expect(result.message).toBe('Internal security error');
  });
});

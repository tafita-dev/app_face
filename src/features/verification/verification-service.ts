import { keychainService } from '../../services/security/keychain-service';
import { compareEmbeddings } from './biometrics/matching-service';
import { lockoutService } from '../security/lockout-service';
import { adaptiveSecurityService } from '../security/adaptive-security-service';

export type VerificationStatus = 'SUCCESS' | 'FAILURE' | 'ERROR' | 'LOCKOUT';

export interface IVerificationResult {
  status: VerificationStatus;
  message: string;
  similarity?: number;
  lockoutRemainingTime?: number;
}

/**
 * Verifies a live biometric embedding against the stored template in the keychain.
 * @param liveEmbedding The current face embedding from the camera.
 * @param threshold Optional similarity threshold. If not provided, it will be calculated dynamically.
 * @returns A result object with status and descriptive message.
 */
export async function verifyIdentity(
  liveEmbedding: Float32Array,
  threshold?: number
): Promise<IVerificationResult> {
  try {
    if (await lockoutService.isLockedOut()) {
      const remaining = await lockoutService.getRemainingLockoutTime();
      return {
        status: 'LOCKOUT',
        message: `Account locked. Try again in ${Math.ceil(remaining / 60000)} minutes.`,
        lockoutRemainingTime: remaining,
      };
    }

    const finalThreshold = threshold !== undefined 
      ? threshold 
      : await adaptiveSecurityService.getRequiredThreshold(false);

    const storedEmbedding = await keychainService.getBiometricTemplate();

    if (!storedEmbedding) {
      return { status: 'ERROR', message: 'No enrollment found' };
    }

    const matchResult = compareEmbeddings(
      liveEmbedding,
      storedEmbedding,
      finalThreshold
    );

    if (matchResult.isMatch) {
      await lockoutService.recordSuccess();
      return {
        status: 'SUCCESS',
        message: 'Verification Success',
        similarity: matchResult.similarity,
      };
    }

    await lockoutService.recordFailure();
    return {
      status: 'FAILURE',
      message: 'Face Not Recognized',
      similarity: matchResult.similarity,
    };
  } catch (error) {
    console.error('Verification error:', error);
    return { status: 'ERROR', message: 'Internal security error' };
  }
}

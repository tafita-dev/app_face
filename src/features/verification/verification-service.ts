import { keychainService } from '../../services/security/keychain-service';
import { compareEmbeddings } from './biometrics/matching-service';
import { lockoutService } from '../security/lockout-service';

export type VerificationStatus = 'SUCCESS' | 'FAILURE' | 'ERROR' | 'LOCKOUT';

export interface IVerificationResult {
  status: VerificationStatus;
  message: string;
  similarity?: number;
  lockoutRemainingTime?: number;
}

const DEFAULT_VERIFICATION_THRESHOLD = 0.85;

/**
 * Verifies a live biometric embedding against the stored template in the keychain.
 * @param liveEmbedding The current face embedding from the camera.
 * @param threshold The similarity threshold for a match (default 0.85).
 * @returns A result object with status and descriptive message.
 */
export async function verifyIdentity(
  liveEmbedding: Float32Array,
  threshold: number = DEFAULT_VERIFICATION_THRESHOLD
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

    const storedEmbedding = await keychainService.getBiometricTemplate();

    if (!storedEmbedding) {
      return { status: 'ERROR', message: 'No enrollment found' };
    }

    const matchResult = compareEmbeddings(
      liveEmbedding,
      storedEmbedding,
      threshold
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

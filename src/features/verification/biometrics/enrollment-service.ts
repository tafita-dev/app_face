import { TensorflowModel } from 'react-native-fast-tflite';
import { extractEmbedding } from './embedding-service';
import { keychainService } from '../../../services/security/keychain-service';

export interface IEnrollmentParams {
  model: TensorflowModel;
  faceImage: Uint8Array;
  livenessScore: number;
  deepfakeScore: number; // Probability of being a deepfake
}

export interface IEnrollmentResult {
  success: boolean;
  error?: string;
}

const LIVENESS_THRESHOLD = 0.9;
const DEEPFAKE_THRESHOLD = 0.1; // Probability of being a deepfake

/**
 * Orchestrates the user enrollment process by verifying security scores
 * before extracting and storing the biometric template.
 * @param params Enrollment parameters including model and scores.
 * @returns Result object with success status and optional error.
 */
export async function enrollUser(params: IEnrollmentParams): Promise<IEnrollmentResult> {
  const { model, faceImage, livenessScore, deepfakeScore } = params;

  // Rule: Liveness must exceed 0.9
  if (livenessScore < LIVENESS_THRESHOLD) {
    return { success: false, error: 'Liveness Check Failed' };
  }

  // Rule: Deepfake risk must be low (Confidence in being real > 0.9, so probability of deepfake < 0.1)
  if (deepfakeScore > DEEPFAKE_THRESHOLD) {
    return { success: false, error: 'Security Risk Detected' };
  }

  try {
    // Extraction: Convert face image to mathematical embedding
    const embedding = await extractEmbedding(model, faceImage);

    // Persistence: Save to Secure Enclave / TEE via Keychain
    const success = await keychainService.saveBiometricTemplate(Array.from(embedding));

    if (!success) {
      return { success: false, error: 'Secure Storage Failed' };
    }

    return { success: true };
  } catch (error) {
    console.error('Enrollment error:', error);
    return { success: false, error: 'Biometric Extraction Failed' };
  }
}

import { enrollUser } from './enrollment-service';
import { extractEmbedding } from './embedding-service';
import { keychainService } from '../../../services/security/keychain-service';
import { TensorflowModel } from 'react-native-fast-tflite';

jest.mock('./embedding-service');
jest.mock('../../../services/security/keychain-service');

describe('EnrollmentService', () => {
  const mockModel = {} as TensorflowModel;
  const mockFaceImage = new Uint8Array(112 * 112 * 3).fill(255);
  const mockEmbedding = new Float32Array(128).fill(0.1);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully enroll user when scores are above threshold', async () => {
    (extractEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (keychainService.saveBiometricTemplate as jest.Mock).mockResolvedValue(true);

    const result = await enrollUser({
      model: mockModel,
      faceImage: mockFaceImage,
      livenessScore: 0.95,
      deepfakeScore: 0.05, // Probability of being a deepfake
    });

    expect(result.success).toBe(true);
    expect(extractEmbedding).toHaveBeenCalledWith(mockModel, mockFaceImage);
    expect(keychainService.saveBiometricTemplate).toHaveBeenCalledWith(mockEmbedding);
  });

  it('should fail enrollment if liveness score is below 0.9', async () => {
    const result = await enrollUser({
      model: mockModel,
      faceImage: mockFaceImage,
      livenessScore: 0.85,
      deepfakeScore: 0.05,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Liveness Check Failed');
    expect(extractEmbedding).not.toHaveBeenCalled();
    expect(keychainService.saveBiometricTemplate).not.toHaveBeenCalled();
  });

  it('should fail enrollment if deepfake score is above 0.1', async () => {
    const result = await enrollUser({
      model: mockModel,
      faceImage: mockFaceImage,
      livenessScore: 0.95,
      deepfakeScore: 0.15, // High probability of being a deepfake
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Security Risk Detected');
    expect(extractEmbedding).not.toHaveBeenCalled();
    expect(keychainService.saveBiometricTemplate).not.toHaveBeenCalled();
  });

  it('should fail if embedding extraction fails', async () => {
    (extractEmbedding as jest.Mock).mockRejectedValue(new Error('Inference error'));

    const result = await enrollUser({
      model: mockModel,
      faceImage: mockFaceImage,
      livenessScore: 0.95,
      deepfakeScore: 0.05,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Biometric Extraction Failed');
  });

  it('should fail if saving to keychain fails', async () => {
    (extractEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
    (keychainService.saveBiometricTemplate as jest.Mock).mockResolvedValue(false);

    const result = await enrollUser({
      model: mockModel,
      faceImage: mockFaceImage,
      livenessScore: 0.95,
      deepfakeScore: 0.05,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Secure Storage Failed');
  });
});

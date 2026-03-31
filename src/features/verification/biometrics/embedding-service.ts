import { TensorflowModel } from 'react-native-fast-tflite';

/**
 * Normalizes a Float32Array using L2 norm.
 */
function l2Normalize(vector: Float32Array): Float32Array {
  let sum = 0;
  for (let i = 0; i < vector.length; i++) {
    sum += vector[i] * vector[i];
  }
  const magnitude = Math.sqrt(sum);
  if (magnitude === 0) return vector;

  const result = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    result[i] = vector[i] / magnitude;
  }
  return result;
}

/**
 * Extracts a biometric embedding from a face image using the provided TFLite model.
 * Input image must be 112x112x3 (RGB).
 * @param model The loaded MobileFaceNet TFLite model.
 * @param faceImage The cropped face image as Uint8Array.
 * @returns A 128-D or 512-D L2-normalized float array.
 */
export async function extractEmbedding(
  model: TensorflowModel,
  faceImage: Uint8Array
): Promise<Float32Array> {
  if (!model) {
    throw new Error('Model not loaded');
  }

  // Expected input: 112x112 RGB
  const expectedSize = 112 * 112 * 3;
  if (faceImage.length !== expectedSize) {
    throw new Error('Invalid input image: Expected 112x112x3 RGB buffer');
  }

  // Pre-processing: Scale pixel values to [-1, 1] as (x - 127.5) / 128
  const input = new Float32Array(faceImage.length);
  for (let i = 0; i < faceImage.length; i++) {
    input[i] = (faceImage[i] - 127.5) / 128.0;
  }

  try {
    // Inference
    // We expect the model's output at index 0
    const output = await model.run([input]);
    if (!output || output.length === 0) {
      throw new Error('Model produced no output');
    }

    const embedding = output[0] as Float32Array;
    
    // Post-processing: L2 normalization
    return l2Normalize(embedding);
  } catch (error) {
    console.error('Inference error in extractEmbedding:', error);
    throw error;
  }
}

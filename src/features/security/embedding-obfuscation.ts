// @ts-ignore
import DeviceInfo from 'react-native-device-info';

/**
 * Derives a salt from the device's unique ID for obfuscation.
 * @returns An array of numbers to be used as XOR salt.
 */
const deriveSalt = (): Uint32Array => {
  const deviceId = DeviceInfo.getUniqueIdSync();
  const salt = new Uint32Array(8); // Use an 8-word salt (256 bits)
  
  // Simple deterministic generation from deviceId
  for (let i = 0; i < deviceId.length; i++) {
    salt[i % salt.length] = (salt[i % salt.length] << 5) - salt[i % salt.length] + deviceId.charCodeAt(i);
  }
  
  return salt;
};

/**
 * Obfuscates a biometric embedding using bitwise XOR with a device-specific salt.
 * Ensures no precision loss by operating on the bit representation of the floats.
 * @param embedding The Float32Array to obfuscate.
 * @returns A new Float32Array containing the obfuscated data.
 */
export const obfuscateEmbedding = (embedding: Float32Array): Float32Array => {
  const salt = deriveSalt();
  
  // Create a copy to work on
  const resultBuffer = embedding.buffer.slice(
    embedding.byteOffset,
    embedding.byteOffset + embedding.byteLength
  );
  const uintView = new Uint32Array(resultBuffer);
  
  for (let i = 0; i < uintView.length; i++) {
    uintView[i] ^= salt[i % salt.length];
  }
  
  return new Float32Array(resultBuffer);
};

/**
 * De-obfuscates a biometric embedding by repeating the XOR operation.
 * @param obfuscated The obfuscated Float32Array.
 * @returns A new Float32Array containing the raw data.
 */
export const deobfuscateEmbedding = (obfuscated: Float32Array): Float32Array => {
  // XOR is its own inverse
  return obfuscateEmbedding(obfuscated);
};

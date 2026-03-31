import { Frame } from 'react-native-vision-camera';

/**
 * Crops a face region from a frame and resizes it to targetSize.
 * This is a worklet-safe function.
 */
export function cropFace(
  frame: Frame,
  bounds: { left: number; top: number; width: number; height: number },
  targetSize: number
): Uint8Array {
  'worklet';
  const frameWidth = frame.width;
  const frameHeight = frame.height;

  // Ensure bounds are within frame
  const left = Math.max(0, Math.floor(bounds.left));
  const top = Math.max(0, Math.floor(bounds.top));
  const width = Math.min(frameWidth - left, Math.floor(bounds.width));
  const height = Math.min(frameHeight - top, Math.floor(bounds.height));

  const result = new Uint8Array(targetSize * targetSize * 3); // RGB

  try {
    const frameBuffer = frame.toArrayBuffer();
    const frameData = new Uint8Array(frameBuffer);

    // Assuming RGBA format from frame.toArrayBuffer()
    // Nearest neighbor interpolation for speed
    for (let y = 0; y < targetSize; y++) {
      for (let x = 0; x < targetSize; x++) {
        // Map target pixel (x, y) to source pixel (srcX, srcY)
        const srcX = left + Math.floor((x / targetSize) * width);
        const srcY = top + Math.floor((y / targetSize) * height);

        const srcIdx = (srcY * frameWidth + srcX) * 4;
        const targetIdx = (y * targetSize + x) * 3;

        result[targetIdx] = frameData[srcIdx];     // R
        result[targetIdx + 1] = frameData[srcIdx + 1]; // G
        result[targetIdx + 2] = frameData[srcIdx + 2]; // B
      }
    }
  } catch (e) {
    console.error('Error cropping face:', e);
  }

  return result;
}

/**
 * Extracts temporal features like specular highlights and edge artifacts from the frame.
 * Samples eye and forehead regions based on facial landmarks.
 */
export function extractTemporalFeatures(
  frame: Frame,
  landmarks: { leftEye?: { x: number; y: number }; rightEye?: { x: number; y: number }; noseBase?: { x: number; y: number } },
  bounds: { left: number; top: number; width: number; height: number }
): { highlights: number; edgeVariance: number } {
  'worklet';
  
  let highlights = 0;
  let edgeVariance = 0;
  
  try {
    const frameBuffer = frame.toArrayBuffer();
    const frameData = new Uint8Array(frameBuffer);
    const frameWidth = frame.width;
    
    // Sample eye areas for highlights
    let sampleCount = 0;
    if (landmarks.leftEye) {
      const x = Math.floor(landmarks.leftEye.x);
      const y = Math.floor(landmarks.leftEye.y);
      const idx = (y * frameWidth + x) * 4;
      highlights += (frameData[idx] + frameData[idx + 1] + frameData[idx + 2]) / 3;
      sampleCount++;
    }
    if (landmarks.rightEye) {
      const x = Math.floor(landmarks.rightEye.x);
      const y = Math.floor(landmarks.rightEye.y);
      const idx = (y * frameWidth + x) * 4;
      highlights += (frameData[idx] + frameData[idx + 1] + frameData[idx + 2]) / 3;
      sampleCount++;
    }
    
    if (sampleCount > 0) highlights /= sampleCount;

    // Estimate edge variance around the face boundary
    // For simplicity, we sample a few points on the left and right edges
    const leftX = Math.floor(bounds.left);
    const rightX = Math.floor(bounds.left + bounds.width);
    const centerY = Math.floor(bounds.top + bounds.height / 2);
    
    const leftIdx = (centerY * frameWidth + leftX) * 4;
    const rightIdx = (centerY * frameWidth + rightX) * 4;
    
    // Rough estimate of local contrast as edge variance
    const leftIntensity = (frameData[leftIdx] + frameData[leftIdx + 1] + frameData[leftIdx + 2]) / 3;
    const rightIntensity = (frameData[rightIdx] + frameData[rightIdx + 1] + frameData[rightIdx + 2]) / 3;
    
    edgeVariance = Math.abs(leftIntensity - rightIntensity); // Simplified metric

  } catch (e) {
    console.error('Error extracting temporal features:', e);
  }
  
  return { highlights, edgeVariance };
}

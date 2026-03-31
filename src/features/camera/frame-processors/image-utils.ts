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

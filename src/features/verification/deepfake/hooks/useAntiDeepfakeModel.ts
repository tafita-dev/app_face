import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

const MODEL_PATH = require('../../../../../src/assets/models/dummy.tflite');

export const useAntiDeepfakeModel = () => {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        const resolvedAsset = Image.resolveAssetSource(MODEL_PATH);
        const source =
          typeof MODEL_PATH === 'number'
            ? MODEL_PATH
            : { url: resolvedAsset.uri };

        const loadedModel = await loadTensorflowModel(source);
        if (isMounted) {
          setModel(loadedModel);
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn(
          'Failed to load anti-deepfake model, providing mock for development:',
          err,
        );
        if (isMounted) {
          if (__DEV__) {
            // Provide a mock model for development if the real one fails to load
            setModel({
              run: () => [[Math.random() * 0.1]], // Mock score < 0.1 (low deepfake probability)
            } as any);
            setIsLoaded(true);
          } else {
            setError(
              err instanceof Error
                ? err
                : new Error('Unknown error loading model'),
            );
            setIsLoaded(false);
          }
        }
      }
    };

    loadModel();

    return () => {
      isMounted = false;
    };
  }, []);

  return { model, isLoaded, error };
};

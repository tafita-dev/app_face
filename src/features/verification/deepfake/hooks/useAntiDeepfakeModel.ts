import { useState, useEffect } from 'react';
import { Image } from 'react-native';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

const createDevMockModel = (): TensorflowModel =>
  ({
    run: () => [[0.05]], // Stable low score (low deepfake probability)
  } as any);

const getModelPath = () => require('../../../../assets/models/dummy.tflite');

export const useAntiDeepfakeModel = () => {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      if (__DEV__ || process.env.NODE_ENV === 'test') {
        if (isMounted) {
          setModel(createDevMockModel());
          setIsLoaded(true);
        }
        return;
      }

      try {
        const modelPath = getModelPath();
        const resolvedAsset = Image.resolveAssetSource(modelPath);
        const source =
          typeof modelPath === 'number'
            ? modelPath
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
            setModel(createDevMockModel());
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

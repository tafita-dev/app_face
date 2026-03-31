import { useState, useEffect } from 'react';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

const MODEL_PATH = require('../../../../assets/models/dummy.tflite');

export const useAntiDeepfakeModel = () => {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        const loadedModel = await loadTensorflowModel(MODEL_PATH);
        if (isMounted) {
          setModel(loadedModel);
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('Failed to load anti-deepfake model, providing mock for development:', err);
        if (isMounted) {
          if (__DEV__) {
            // Provide a mock model for development if the real one fails to load
            setModel({
              run: (inputs: any) => [[Math.random() * 0.1]], // Mock score < 0.1 (low deepfake probability)
            } as any);
            setIsLoaded(true);
          } else {
            setError(err instanceof Error ? err : new Error('Unknown error loading model'));
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

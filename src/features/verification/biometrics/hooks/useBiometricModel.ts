import { useState, useEffect } from 'react';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

const MODEL_PATH = require('../../../../assets/models/mobilefacenet.tflite');

/**
 * Hook to load and manage the MobileFaceNet TFLite model.
 */
export const useBiometricModel = () => {
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
        console.error('Failed to load biometric model:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error loading model'));
          setIsLoaded(false);
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

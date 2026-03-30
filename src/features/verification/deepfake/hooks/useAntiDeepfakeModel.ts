import { useState, useEffect } from 'react';
import { loadTensorflowModel, TensorflowModel } from 'react-native-fast-tflite';

const MODEL_PATH = require('../../../../assets/models/dummy.tflite');

export const useAntiDeepfakeModel = () => {
  const [model, setModel] = useState<TensorflowModel | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await loadTensorflowModel(MODEL_PATH);
        setModel(loadedModel);
        setIsLoaded(true);
      } catch (err) {
        console.error('Failed to load anti-deepfake model:', err);
        setError(err instanceof Error ? err : new Error('Unknown error loading model'));
        setIsLoaded(false);
      }
    };

    loadModel();
  }, []);

  return { model, isLoaded, error };
};

import { useSharedValue } from 'react-native-reanimated';

export const BUFFER_SIZE = 5;

export const useTemporalConsistency = () => {
  const history = useSharedValue<{ yaw: number; highlights: number; edgeVariance: number }[]>([]);

  const analyzeFrame = (yaw: number, highlights: number, edgeVariance: number = 0): number => {
    'worklet';
    
    const newEntry = { yaw, highlights, edgeVariance };
    const currentHistory = [...history.value, newEntry];
    
    if (currentHistory.length > BUFFER_SIZE) {
      currentHistory.shift();
    }
    
    history.value = currentHistory;

    if (currentHistory.length < BUFFER_SIZE) {
      return 1.0; // Not enough data yet
    }

    // 1. Check for Frozen Highlights
    const yawRange = Math.abs(currentHistory[BUFFER_SIZE - 1].yaw - currentHistory[0].yaw);
    const highlightRange = Math.abs(currentHistory[BUFFER_SIZE - 1].highlights - currentHistory[0].highlights);

    if (yawRange > 10 && highlightRange < 5) {
      return 0.1; // Highlights are frozen despite movement
    }

    // 2. Check for Specular Correlation
    // In a real scenario, this would be more complex (e.g., Pearson correlation)
    // For KISS, we check if both change in the same "direction" or at least both change
    if (yawRange > 5 && highlightRange > 10) {
      let score = 0.8;
      
      // 3. Check for Ghosting (Edge Artifacts)
      const avgEdgeVariance = currentHistory.reduce((acc, curr) => acc + curr.edgeVariance, 0) / BUFFER_SIZE;
      if (avgEdgeVariance > 50) {
        score -= 0.4;
      }
      
      return score;
    }

    return 0.5; // Neutral
  };

  return { analyzeFrame };
};

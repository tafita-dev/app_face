const DEFAULT_MATCH_THRESHOLD = 0.85;

/**
 * Result of the biometric matching operation.
 */
export interface IMatchingResult {
  similarity: number;
  isMatch: boolean;
}

/**
 * Compares two biometric embeddings using Cosine Similarity.
 * Since embeddings from our extraction service are L2-normalized,
 * this is equivalent to the dot product.
 * 
 * @param embeddingA First embedding (Float32Array)
 * @param embeddingB Second embedding (Float32Array)
 * @param threshold Security threshold for matching (default 0.85)
 * @returns Result with similarity score and match status
 */
export function compareEmbeddings(
  embeddingA: Float32Array,
  embeddingB: Float32Array,
  threshold: number = DEFAULT_MATCH_THRESHOLD
): IMatchingResult {
  if (embeddingA.length !== embeddingB.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  for (let i = 0; i < embeddingA.length; i++) {
    dotProduct += embeddingA[i] * embeddingB[i];
  }

  // Ensure dotProduct is within [-1, 1] due to precision errors
  const similarity = Math.max(-1, Math.min(1, dotProduct));

  return {
    similarity,
    isMatch: similarity > threshold,
  };
}

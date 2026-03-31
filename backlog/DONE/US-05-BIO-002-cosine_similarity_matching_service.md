---
id: US-05-BIO-002
title: Cosine Similarity Matching Service
status: DONE
type: feature
---
# Description
As a security service, I want to compare two biometric embeddings using Cosine Similarity so that I can determine if they belong to the same person.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/biometrics/matching-service.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Successful Match
    - Given two embeddings that are highly similar
    - When `compareEmbeddings` is called
    - Then the similarity score should be high (e.g., > 0.9) and `isMatch` should be true if above the threshold.
- [x] **Scenario 2:** Non-Match
    - Given two embeddings from different faces
    - When `compareEmbeddings` is called
    - Then the similarity score should be low and `isMatch` should be false.
- [x] **Scenario 3:** Configurable Threshold
    - Given a custom security threshold (e.g., 0.85)
    - When matching embeddings
    - Then `isMatch` must strictly follow the rule: `similarity >= threshold`.

# Technical Notes (Architect)
- Cosine Similarity formula: `(A · B) / (||A|| * ||B||)`.
- Since embeddings from MobileFaceNet are usually normalized, this simplifies to the dot product of A and B.
- Default threshold should be 0.85 as per PRD Rule 5.

# Reviewer Feedback (Reviewer)
The implementation is mathematically correct and follows the technical notes by simplifying Cosine Similarity to a dot product for normalized embeddings. The code is clean, efficient, and well-tested, covering both the core logic and edge cases like length validation and numerical clamping.

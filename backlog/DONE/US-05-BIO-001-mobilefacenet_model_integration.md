---
id: US-05-BIO-001
title: MobileFaceNet Model Integration
status: DONE
type: feature
---
# Description
As a verification system, I want to use the MobileFaceNet TFLite model to extract biometric embeddings from a face image so that I can perform identity matching.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/biometrics/embedding-service.ts
> *   @src/features/verification/biometrics/hooks/useBiometricModel.ts
> *   @src/assets/models/mobilefacenet.tflite

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Model Loading
    - Given the application is initializing
    - When the `embedding-service` is called
    - Then the `mobilefacenet.tflite` model should be loaded via `react-native-fast-tflite`.
- [x] **Scenario 2:** Embedding Extraction
    - Given a cropped face image (Uint8Array)
    - When `extractEmbedding` is called
    - Then it should return a 128-D or 512-D float array representing the biometric features.
- [x] **Scenario 3:** Invalid Input Handling
    - Given an invalid or empty image buffer
    - When `extractEmbedding` is called
    - Then it should throw an error or return null.

# Technical Notes (Architect)
- **Model Storage**: Place the `mobilefacenet.tflite` model in `src/assets/models/`. For development, a dummy `.tflite` can be used.
- **Model Loading**: Implement a `useBiometricModel` hook in `src/features/verification/biometrics/hooks/` following the pattern in `useAntiDeepfakeModel.ts`.
- **Inference**: Use `react-native-fast-tflite`.
- **Input Pre-processing**:
    - Target size: 112x112 RGB.
    - Resizing: Use the `cropFace` utility from `image-utils.ts` (reuse logic).
    - Normalization: Scale pixel values to `[-1, 1]` or `[0, 1]` as required by the specific MobileFaceNet implementation (standard is `(x - 127.5) / 128`).
- **Output Post-processing**: The model returns a `Float32Array`. Ensure it is L2-normalized if the model doesn't already do it.
- **Testing**: Mock `react-native-fast-tflite` and verify the `extractEmbedding` logic with dummy data.

# Reviewer Feedback (Reviewer)
The implementation is clean and follows the TDD cycle. Pre-processing and L2-normalization are correctly implemented according to architectural notes.

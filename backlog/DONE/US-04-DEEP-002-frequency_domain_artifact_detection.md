---
id: US-04-DEEP-002
title: Frequency-Domain Artifact Detection
status: DONE
type: feature
---
# Description
As a security service, I want to analyze frames in the frequency domain using TFLite to detect GAN-generated artifacts.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/features/camera/frame-processors/face-processor.ts` (Worklet integration)
> *   `src/features/verification/deepfake/hooks/useAntiDeepfakeModel.ts` (Model access)
> *   `src/features/camera/frame-processors/types.ts` (Interface definitions)

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Face Cropping & Pre-processing
    - Given a face is detected in the frame
    - When the frame processor captures the facial region defined by the bounding box
    - Then the system should crop and resize the region to the model's required input size (e.g., 224x224) using JSI-optimized methods.
- [x] **Scenario 2:** GAN Artifact Inference
    - Given a cropped face region
    - When `model.run()` is called within the frame processor worklet
    - Then the system should retrieve the classification result (probability score).
- [x] **Scenario 3:** Score Mapping (Happy Path)
    - Given a classification result from the model
    - When the frame processor returns data
    - Then the result should be mapped to `IFaceDetection.deepfakeScore` and `IFaceDetection.textureAnalysis.frequencyArtifacts`.
- [x] **Scenario 4:** Inference Frequency Control
    - Given the frame processor is running at 30+ FPS
    - When the system performs deepfake analysis
    - Then it should only run inference every N frames (e.g., N=10) to optimize battery life while maintaining security.

# UI element
None. This story is logic-focused.

# Technical Notes (Architect)
- **JSI Worklet Strategy**: The model inference must be integrated into the `trackFacialLandmarks` worklet or a chained worklet. 
- **Tensor Input**: Use `react-native-fast-tflite`'s ability to handle raw buffers. If the model requires normalized inputs, this must be done within the worklet using SIMD-like operations if possible, or ensured by the model's own quantization layers.
- **Bounding Box Stability**: Use a slightly expanded bounding box (10-20% padding) to ensure the entire face is captured for the GAN analysis, as artifacts are often prominent at edges.
- **Async Handling**: Although inference is synchronous within the worklet thread, it should not block the UI thread. Reanimated shared values will handle the data transfer back to the JS thread.
- **Data Dictionary**: `deepfakeScore` represents the probability of the face being a GAN-generated image.

status: DONE

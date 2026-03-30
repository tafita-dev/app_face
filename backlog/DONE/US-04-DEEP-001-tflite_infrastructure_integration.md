---
id: US-04-DEEP-001
title: TFLite Infrastructure Integration
status: DONE
type: feature
---
# Description
As a developer, I want to integrate the `react-native-fast-tflite` library and prepare the infrastructure to load on-device models so that synthetic artifact analysis can be performed in real-time.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   `src/features/camera/frame-processors/face-processor.ts` (Entry point for TFLite inference)
> *   `src/assets/models/` (Storage for .tflite models)
> *   `metro.config.js` (Asset extension configuration)
> *   `package.json` (Library dependency)

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Model Infrastructure Setup
    - Given the application is initialized
    - When `react-native-fast-tflite` is configured and a dummy `.tflite` model is in `src/assets/models/`
    - Then the system should be able to load the model using `loadTensorflowModel`.
- [ ] **Scenario 2:** Model Loading Error Handling
    - Given a missing or corrupted `.tflite` model file
    - When `loadTensorflowModel` is called
    - Then the system should catch the error, log it, and ensure the Frame Processor continues to run without the deepfake check.
- [ ] **Scenario 3:** Native Worklet Integration
    - Given a `TensorflowModel` object
    - When passed to a Vision Camera Frame Processor (Worklet)
    - Then the `model.run()` method should be callable within the worklet context without bridge overhead.

# UI element
None. This is an infrastructure story.

# Technical Notes (Architect)
- **Library Selection**: `react-native-fast-tflite` is chosen for its JSI integration, allowing zero-copy buffer sharing between Vision Camera and TFLite.
- **Asset Configuration**: Update `metro.config.js` to include `tflite` in `resolver.assetExts` to ensure models are bundled correctly.
- **Lifecycle Management**: Load the model once (e.g., in a dedicated hook or service) and memoize the `TensorflowModel` instance. Avoid re-loading on every frame.
- **Data Conversion**: Ensure the frame buffer (from Vision Camera) is correctly converted to the input tensor format (RGB, normalized 0-1) required by the anti-deepfake model.
- **Performance**: Monitor the execution time of `model.run()`. It must not exceed 50ms per frame to maintain a smooth UI/Preview experience.

# Reviewer Feedback (Reviewer)

---
id: US-04-DEEP-002
title: Frequency-Domain Artifact Detection
status: READY
type: feature
---
# Description
As a security service, I want to analyze frames in the frequency domain using TFLite to detect GAN-generated artifacts.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/camera/frame-processors/face-processor.ts
> *   @src/features/verification/deepfake/

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** FFT Pre-processing
    - Given a face in the camera frame
    - When the frame processor captures the facial region
    - Then it should apply an FFT transformation or equivalent pre-processing for the TFLite model.
- [ ] **Scenario 2:** GAN Artifact Detection (Happy Path)
    - Given a high-quality GAN-generated face (deepfake)
    - When the model is executed on the frame
    - Then it should return a high probability score for GAN artifacts (> 0.7).
- [ ] **Scenario 3:** Real Human Face (Happy Path)
    - Given a real human face in natural lighting
    - When the model is executed on the frame
    - Then it should return a low probability score for GAN artifacts (< 0.2).

# UI element
None. This story is logic-focused.

# Technical Notes (Architect)
- The model should be optimized for mobile (quantized TFLite).
- The analysis should occur on the face region defined by MLKit landmarks.
- Frequency artifacts should be stored in the `textureAnalysis` object.

# Reviewer Feedback (Reviewer)

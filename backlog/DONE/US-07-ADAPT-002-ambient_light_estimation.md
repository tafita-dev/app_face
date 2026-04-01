---
id: US-07-ADAPT-002
title: Ambient Light Analysis
status: DONE
type: feature
---
# Description
As a vision service, I want to estimate the ambient light level from the camera frames so that I can adjust the verification threshold for low-light conditions.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/camera/frame-processors/face-processor.ts
> *   @src/features/camera/frame-processors/image-utils.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Low Light Detection**
    - Given a camera frame with average pixel intensity below a "Low Light" threshold (e.g., < 40/255)
    - When the frame processor analyzes the frame
    - Then it should return a `isLowLight: true` flag in the `textureAnalysis` metadata.
- [x] **Scenario 2: Optimal Light Detection**
    - Given a well-lit camera frame
    - When analyzed
    - Then it should return `isLowLight: false`.
- [x] **Scenario 3: Performance Constraint**
    - Given the light analysis is running on every frame
    - When executed within the Worklet
    - Then the calculation must add less than 5ms of latency to the frame processor.

# Technical Notes (Architect)
- Implement a simple grayscale average or histogram analysis in `image-utils.ts`.
- Expose the value to the JS thread via the `face` shared value.

---
id: US-01-INFRA-004
title: Frame Processor & JSI Infrastructure
status: IN_PROGRESS
type: feature
---
# Description
As a Developer, I want a high-performance Frame Processor setup using JSI so that I can run complex AI/ML logic on every camera frame without blocking the UI thread.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/features/camera/frame-processors/`
> * `babel.config.js`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1:** Frame Processor initialization
    - Given the camera is active
    - When a Frame Processor is attached
    - Then the logs should confirm that frames are being received on the Worklet thread.
- [ ] **Scenario 2:** High-performance data transfer
    - Given a Frame Processor running
    - When metadata (like frame dimensions) is extracted
    - Then the data should be accessible on the JS thread via a Shared Value or Worklet without lag.
- [ ] **Scenario 3:** Babel/Plugin configuration
    - Given the project configuration
    - When building the app
    - Then the Worklets plugin should be correctly applied, allowing the use of `useFrameProcessor`.

# UI element
- None (Performance/Infrastructure focused).

# Technical Notes (Architect)
- Must install `react-native-worklets-core` and configure `react-native-vision-camera` (v4+).
- Babel Configuration:
  - Add `react-native-worklets-core/plugin` to `babel.config.js`.
  - Add `react-native-vision-camera/babel-plugin` to `babel.config.js`.
- Implementation:
  - Create directory `src/features/camera/frame-processors/`.
  - Implement a base hook `useFrameProcessor` (or equivalent wrapper) that exposes the frame analysis lifecycle.
  - Implement a test worklet to verify communication between Native and JS threads (simple frame count).
- Performance: Ensure that all Frame Processors are declared as `@worklet` functions to stay off the JS thread.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/features/camera/frame-processors/`
> * `babel.config.js`
> * `src/features/camera/hooks/useFrameProcessor.ts`

# Reviewer Feedback (Reviewer)

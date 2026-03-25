---
id: US-01-INFRA-004
title: Frame Processor & JSI Infrastructure
status: READY
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
- Must install `react-native-worklets-core`.
- Configure `babel.config.js` with `'react-native-vision-camera/babel-plugin'`.
- This is the foundation for all subsequent ML detection (MLKit/TFLite).

# Reviewer Feedback (Reviewer)

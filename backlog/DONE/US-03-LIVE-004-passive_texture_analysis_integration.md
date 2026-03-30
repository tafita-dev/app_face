---
id: US-03-LIVE-004
title: Passive Texture Analysis Integration
status: DONE
type: feature
---

# Description
As a security system, I want to analyze the texture of the captured frame in the background so that I can detect digital replays or paper masks without user interaction.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/passive-liveness.ts
> *   @src/features/camera/frame-processors/face-processor.ts (Integration point)

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Passive Check Execution**
    - Given the camera is streaming frames
    - When the liveness flow is in `ANALYZING` state
    - Then the passive analyzer evaluates at least 5 keyframes for texture artifacts.

- [x] **Scenario 2: Screen Replay Detected**
    - Given the user is presenting a digital screen
    - When the passive analyzer detects Moire patterns or frequency artifacts
    - Then it returns a `livenessScore` below 0.5.

- [x] **Scenario 3: Real Human Detected**
    - Given a real person is in front of the camera
    - When the analyzer completes
    - Then it returns a `livenessScore` above 0.8.

# Reviewer Feedback
- **Functional Error**: The native `FaceDetectorPlugin` (both Android and iOS) has `contourMode` set to `NONE` and does not extract or return face contours.
- **Impact**: The `useLivenessMachine` relies on eye contours for `US-03-LIVE-002` (Blink Detection). Since contours are missing, the blink challenge can never be completed, and the flow never reaches the `ANALYZING` state required for `US-03-LIVE-004` to run.
- **Clean Code**: The `calculateLaplacianVariance` implementation is correct, but it cannot be validated functionally.
- **Consistency**: The `useUserGuidance.ts` and `FaceGuide.tsx` files on disk are inconsistent with the staged versions (work-in-progress for US-03-LIVE-005 leaked into the files).

**To Fix:**
1. Enable `CONTOUR_MODE_ALL` in `FaceDetectorPlugin.kt` and `FaceDetectorPlugin.swift`.
2. Extract and return the `contours` map in the native plugin results.
3. Ensure the liveness flow can actually reach the `ANALYZING` state on a real device.

# Technical Notes (Architect)
- Initially, implement a hook for a TFLite model.
- If no model is available, use basic pixel variance or laplacian variance to check for "flatness" or blurring common in replays.
- This runs on the `ANALYZING` state to avoid UI lag during active challenges.

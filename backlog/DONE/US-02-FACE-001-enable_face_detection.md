---
id: US-02-FACE-001
title: Enable Real-time Face Detection
status: DONE
type: feature
---

# Description

As a user interacting with the camera, I want the system to detect my face in real-time so that the biometric verification process can start.

# Context Map

> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
>
> - @src/features/camera/frame-processors/face-processor.ts (Worklet Implementation)
> - @src/features/camera/hooks/useFaceDetection.ts (Hook managing shared values)
> - @src/features/camera/frame-processors/types.ts (Interface definitions)
> - @specs/03-ARCHITECTURE.md (System-wide IFaceDetection interface)

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Happy Path - Single Face Detected**
  - Given the camera is active and a face is clearly in view,
  - When the `face-processor` processes a frame,
  - Then a face is detected, and the result matches the `IFaceDetection` schema (bounds, angles).
  - And the detection latency (frame to result) is under 200ms.

- [x] **Scenario 2: Error Case - No Face Present**
  - Given the camera is active and no face is in the frame,
  - When the `face-processor` processes a frame,
  - Then the result indicates no face detected (e.g., null or empty list).

- [x] **Scenario 3: Edge Case - Multiple Faces**
  - Given the camera is active and multiple faces are visible,
  - When the `face-processor` processes a frame,
  - Then the system prioritizes and returns the most prominent face (largest bounding box).

- [x] **Scenario 4: Performance - Under Load**
  - Given the camera is streaming at 30fps,
  - When face detection is active,
  - Then the frame processor does not cause frame drops (UI remains at 60fps, camera feed remains smooth).

- [x] **Scenario 5: Reliability - Variable Lighting**
  - Given the ambient lighting is between 50 lux (dim) and 10000 lux (bright),
  - When a face is presented,
  - Then the system successfully detects it within the 200ms threshold.

# UI element
- **Face Guide State Logic**: While visual rendering is in `US-02-FACE-003`, this story must provide the `validPosition` flag (boolean) based on whether the face is detected and meets basic centering requirements.

# Technical Notes (Architect)
- **Unified Processor Strategy**: Implement the face detection logic within `src/features/camera/frame-processors/face-processor.ts` using `react-native-vision-camera` v4.
- **MLKit Configuration**:
  - `performanceMode`: `accurate` (to ensure high trust for biometric flow).
  - `landmarkMode`: `none` (landmarks will be added in `US-02-FACE-002`).
  - `contourMode`: `none`.
- **Worklet Threading**: The detection must run on the worklet thread. Use `Worklets.createRunOnJS` if any UI updates are needed outside of Reanimated shared values, but prefer `useSharedValue` for performance.
- **Coordinate System**: Return bounds in the camera's native coordinate system. `useFaceDetection` hook should handle mapping these to screen coordinates using the frame's `width` and `height`.
- **Data Flow**: `useFaceDetection` will expose a `face: SharedValue<IFaceDetection | null>` to the rest of the application.

# Reviewer Feedback (Reviewer)
- [x] **APPROVED**: Rework addressed hardcoded dimensions and frame-based scaling. 
- [x] Coordinate mapping logic is now dynamically tied to frame dimensions within the worklet thread, satisfying architecture requirements for high-performance processing.

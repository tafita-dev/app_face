---
id: US-02-FACE-003
title: Visualize Face Detection and Landmarks with Skia
status: READY
type: feature
---

# Description

As a user, I want to see a visual overlay of the detected face and landmarks so that I know the system is working correctly.

# Context Map

> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
>
> - @src/features/camera/components/FaceGuide.tsx
> - @src/features/camera/CameraView.tsx
> - @src/features/camera/hooks/useFaceDetection.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Happy Path - Bounding Box Rendering**
  - Given a face is detected,
  - When the camera view is rendered,
  - Then a thin green bounding box is drawn exactly around the face's detected area.

- [ ] **Scenario 2: Happy Path - Landmark Rendering**
  - Given facial landmarks are detected,
  - When the camera view is rendered,
  - Then yellow dots are drawn at the positions of eyes, nose, and mouth.

- [ ] **Scenario 3: Real-time Synchronization**
  - Given the face is moving,
  - When the visualization is active,
  - Then the bounding box and landmarks follow the face with zero perceived lag (using Reanimated Shared Values).

- [ ] **Scenario 4: Clear State - No Detection**
  - Given no face is detected,
  - When the camera view is rendered,
  - Then no overlays are visible.

# UI element
- Thin green rectangle (Bounding box).
- Small yellow circles (Landmarks).
- Using `react-native-skia`.

# Technical Notes (Architect)
- Use `FaceGuide.tsx` as the Skia overlay component.
- Pass face data from the frame processor to Skia via `useSharedValue`.
- Ensure coordinates are correctly mapped from the camera frame coordinate system to the screen coordinate system.

# Reviewer Feedback (Reviewer)

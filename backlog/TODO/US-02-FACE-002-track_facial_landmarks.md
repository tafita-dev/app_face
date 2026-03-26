---
id: US-02-FACE-002
title: Track Facial Landmarks in Real-time
status: READY
type: feature
---

# Description

As a user whose face is detected, I want the system to track my key facial landmarks (eyes, nose, mouth) so that high-precision liveness checks can be performed.

# Context Map

> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
>
> - @src/features/camera/frame-processors/face-processor.ts
> - @src/features/camera/hooks/useFaceDetection.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Happy Path - Landmark Extraction**
  - Given a face is detected in the camera view,
  - When the `face-processor` runs,
  - Then it extracts the positions of the eyes (left, right), nose base, and mouth (left, right, bottom).
  - And these coordinates are returned within the `IFaceDetection.landmarks` object.

- [ ] **Scenario 2: Landmark Stability**
  - Given a face is stationary in the frame,
  - When landmarks are tracked across multiple frames,
  - Then the coordinate jitter is minimal (coordinates do not jump significantly between frames).

- [ ] **Scenario 3: Error Case - Landmarks Occluded**
  - Given a face is detected but some features are occluded (e.g., mouth covered by hand),
  - When the `face-processor` runs,
  - Then it returns coordinates for visible features and `undefined` or null for occluded ones.

# UI element
- None (Visualization is handled in US-02-FACE-003).

# Technical Notes (Architect)
- Enable landmark detection in MLKit configuration.
- Update the unified `face-processor.ts` to include landmark data in the return object.
- Map MLKit landmark types to the `IFaceDetection` interface keys.

# Reviewer Feedback (Reviewer)

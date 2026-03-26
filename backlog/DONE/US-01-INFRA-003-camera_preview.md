---
id: US-01-INFRA-003
title: Camera Preview & Lifecycle Management
status: DONE
type: feature
---
# Description
As a User, I want to see a full-screen, high-performance camera preview so that I can accurately position my face for biometric scanning.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/features/camera/CameraView.tsx`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1:** Full-screen preview
    - Given camera permissions are granted
    - When the Scan screen opens
    - Then the camera feed should be visible, cover the full screen, and maintain correct aspect ratio.
- [ ] **Scenario 2:** App lifecycle (Backgrounding)
    - Given the camera is active
    - When the app is moved to the background and then foregrounded
    - Then the camera should correctly release and re-acquire the camera resource without crashing.
- [ ] **Scenario 3:** Camera Selection
    - Given a device with multiple cameras
    - When the preview starts
    - Then it should default to the front-facing "selfie" camera.

# UI element
- Full-screen `<Camera />` component from Vision Camera.

# Technical Notes (Architect)
- Use `react-native-vision-camera` (v4).
- Default to `front` device.
- Ensure `isActive` prop is synced with screen focus and app state to save battery.

# Reviewer Feedback (Reviewer)
- [x] **REJECTED**: The current implementation of `CameraView.tsx` does not include `testID="camera-view"` which is required for the tests to pass.
- [ ] Please add `testID="camera-view"` to the `<Camera />` component.
- [ ] Ensure all tests pass after the change.

---
id: US-01-INFRA-005
title: Skia UI Overlay Integration
status: IN_PROGRESS
type: feature
---
# Description
As a User, I want to see a smooth, high-performance UI overlay on top of the camera preview so that I have visual guidance during the scanning process.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/components/camera/FaceGuide.tsx`
> * `src/features/camera/CameraView.tsx`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1:** Overlay Visibility
    - Given the camera is active
    - When the scanning screen is visible
    - Then a Skia-rendered oval guide should be drawn over the center of the camera preview.
- [ ] **Scenario 2:** Performance (60 FPS)
    - Given the Skia overlay is active
    - When the camera is running
    - Then the UI should remain responsive (60 FPS) without stuttering during camera movements.
- [ ] **Scenario 3:** Dynamic Sizing
    - Given different screen sizes
    - When the component mounts
    - Then the Face Guide oval should scale proportionally to the screen dimensions.

# UI element
- Skia Canvas with an `<Oval />` (Face Guide) as described in `specs/02-UX-DESIGN.md`.

# Technical Notes (Architect)
- Must install `react-native-skia` and `react-native-reanimated`.
- Implementation:
  - Create `src/components/camera/FaceGuide.tsx` (using Skia `<Canvas>` and `<Path>` or `<Oval>`).
  - Overlay: Ensure the canvas is absolutely positioned to `StyleSheet.absoluteFill` to match the Camera view.
  - Integration: Use Reanimated `useSharedValue` to track the state of the face guide (e.g., color `Blue` -> `Green` based on verification state).
- Performance:
  - Keep Skia render logic simple to maintain 60 FPS.
  - Memoize Skia components where necessary.
- UI Consistency:
  - Follow `specs/02-UX-DESIGN.md` regarding the dynamic face guide dimensions and color changes (Blue: Idle, Green: Valid position).

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/components/camera/FaceGuide.tsx`
> * `src/features/camera/CameraView.tsx`
> * `src/features/camera/ScanScreen.tsx`
> * `specs/02-UX-DESIGN.md`

# Reviewer Feedback (Reviewer)

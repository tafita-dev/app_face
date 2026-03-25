---
id: US-01-INFRA-005
title: Skia UI Overlay Integration
status: READY
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
- Use `react-native-skia`.
- Ensure the Skia Canvas is positioned absolutely over the Vision Camera component.
- Use Reanimated Shared Values to eventually drive the Guide's color and scale based on detector results.

# Reviewer Feedback (Reviewer)

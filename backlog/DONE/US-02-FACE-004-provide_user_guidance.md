---
id: US-02-FACE-004
title: Provide User Guidance for Optimal Detection
status: DONE
type: feature
---

# Description

As a user, I want the system to tell me if I need to move closer or center my face so that the detection can be optimized for liveness checks.

# Context Map

> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
>
> - @src/features/camera/hooks/useUserGuidance.ts
> - @src/features/camera/components/FaceGuide.tsx

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Guidance - "Move Closer"**
  - Given a face is detected but it occupies less than 30% of the screen width,
  - When the guidance hook evaluates the state,
  - Then it returns the message "Move closer".

- [x] **Scenario 2: Guidance - "Center your face"**
  - Given a face is detected but its center is more than 20% away from the screen center,
  - When the guidance hook evaluates the state,
  - Then it returns the message "Center your face".

- [x] **Scenario 3: Guidance - "Stay Still"**
  - Given a face is centered and at the correct distance,
  - When the guidance hook evaluates the state,
  - Then it returns "Perfect, stay still" or a success indicator.

- [x] **Scenario 4: Feedback UI**
  - Given a guidance message is active,
  - When the `FaceGuide` component renders,
  - Then the message is displayed in a clear, readable overlay text.

# UI element
- Text overlay at the top or bottom of the camera preview.
- Style: Bold, high-contrast text with a semi-transparent background for readability.

# Technical Notes (Architect)
- Create `src/features/camera/hooks/useUserGuidance.ts`.
- The hook should take `IFaceDetection` data as input.
- Define constants for threshold values (DISTANCE_THRESHOLD, CENTER_THRESHOLD).

# Reviewer Feedback (Reviewer)

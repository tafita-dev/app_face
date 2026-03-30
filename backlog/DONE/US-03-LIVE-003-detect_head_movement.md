---
id: US-03-LIVE-003
title: Detect Head Movement (Active Liveness)
status: DONE
type: feature
---

# Description
As a security system, I want to detect if the user rotates their head (Yaw/Pitch) so that I can verify the 3D structure of the face and prevent 2D replay attacks.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/movement-detection.ts
> *   @src/features/camera/frame-processors/types.ts (rollAngle, pitchAngle, yawAngle)

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Detect Head Turn Left/Right**
    - Given the challenge is `CHALLENGE_ROTATION`
    - When the user turns their head more than 20 degrees on the Yaw axis
    - Then the challenge is marked as COMPLETED.

- [x] **Scenario 2: Detect Head Tilt Up/Down**
    - Given the challenge is `CHALLENGE_PITCH` (if applicable)
    - When the user tilts their head more than 15 degrees on the Pitch axis
    - Then the challenge is marked as COMPLETED.

- [x] **Scenario 3: Abrupt Movement (Anti-Deepfake)**
    - Given the user is performing a rotation
    - When the angle changes by more than 40 degrees in a single frame (1/30s)
    - Then trigger a "Temporal Inconsistency" warning and fail the check.

# Technical Notes (Architect)
- Use `yawAngle` and `pitchAngle` from the `IFaceDetection` interface.
- Implement a smoothing filter (moving average) to avoid jitter-induced false completions.

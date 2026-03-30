---
id: US-03-LIVE-002
title: Detect Eye Blink (Active Liveness)
status: DONE
type: feature
---

# Description
As a security system, I want to detect if the user blinks their eyes so that I can verify they are a live person and not a static photo.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/blink-detection.ts
> *   @src/features/camera/frame-processors/types.ts (IFaceDetection landmarks)

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Successful Blink Detection**
    - Given the liveness state is `CHALLENGE_BLINK`
    - When the user closes both eyes (EAR < threshold) and then opens them (EAR > threshold)
    - Then the challenge is marked as COMPLETED within 1 second.

- [x] **Scenario 2: One Eye Blink (False Positive)**
    - Given the user only blinks one eye
    - When the detection logic runs
    - Then it does NOT trigger a successful blink (require both eyes for high trust).

- [x] **Scenario 3: Timeout**
    - Given the liveness state is `CHALLENGE_BLINK`
    - When the user does not blink within 5 seconds
    - Then the challenge fails and the state resets.

# Reviewer Feedback
- **Critical Failure**: The native `FaceDetectorPlugin` (Kotlin and Swift) is configured with `CONTOUR_MODE_NONE`.
- **Impact**: EAR calculation requires eye contours (the 16-point loop). Without this mode, MLKit only returns a single landmark point for the eye center, which is insufficient for Eye Aspect Ratio calculation.
- **Missing Data**: The `contours` map is never populated in the native results returned to JS.

# Technical Notes (Architect)
- Calculate **Eye Aspect Ratio (EAR)**: `(dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4))`.
- Thresholds: Typically ~0.2 for closed, ~0.3 for open.
- Must be performed on the UI thread/JS side using landmarks provided by the frame processor.

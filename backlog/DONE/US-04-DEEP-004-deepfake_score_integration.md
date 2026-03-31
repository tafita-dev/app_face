---
id: US-04-DEEP-004
title: Deepfake Score Integration
status: DONE
type: feature
---
# Description
As a verification system, I want to aggregate all anti-deepfake analysis results into a single "Deepfake Confidence Score" and integrate it with the Liveness State Machine so that synthetic attacks can be blocked.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/useLivenessMachine.ts
> *   @src/features/verification/deepfake/
> *   @src/store/app-slice.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Deepfake Score Aggregation
    - Given GAN artifact detection results and temporal consistency data
    - When the session analysis is complete
    - Then a weighted "Deepfake Confidence Score" (0.0 to 1.0) should be calculated.
- [ ] **Scenario 2:** Verification Block on High Deepfake Score
    - Given a deepfake score greater than 0.8
    - When the Liveness State Machine reaches the "ANALYZING" state
    - Then the machine should transition to the "FAILURE" state and log a security risk.
- [ ] **Scenario 3:** User Alert for Deepfake Detection
    - Given a failed verification due to high deepfake probability
    - When the application UI is updated
    - Then the "Security Alert" screen should be displayed as per `specs/02-UX-DESIGN.md`.

# UI element
- **Screen:** Security Alert (Critical) as defined in `specs/02-UX-DESIGN.md`.

# Technical Notes (Architect)
- The weight for GAN artifact detection should be higher than temporal consistency.
- The aggregation logic should be contained in the `DeepfakeService` or similar utility.
- The score should be stored in the Redux store for audit logging.

# Reviewer Feedback (Reviewer)

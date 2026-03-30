---
id: US-04-DEEP-003
title: Temporal Consistency Analysis
status: READY
type: feature
---
# Description
As a security service, I want to analyze the temporal consistency of face edges and specular highlights across multiple frames to detect deepfake synthesis artifacts.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/deepfake/
> *   @src/features/verification/liveness/

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Specular Highlight Consistency (Success)
    - Given a real human face in a dynamic lighting environment (or moving face)
    - When the highlights on the eyes and forehead change naturally across 5+ frames
    - Then the system should mark the temporal consistency as high.
- [ ] **Scenario 2:** Ghosting/Edge Artifact Detection
    - Given a deepfake overlay that shows unnatural blending (ghosting) around the face boundary
    - When the temporal edge analysis is performed across 5+ frames
    - Then the system should detect "ghosting artifacts" and increase the deepfake probability.
- [ ] **Scenario 3:** Frozen Highlight Detection
    - Given a digital replay or deepfake with static/baked-in highlights
    - When the eye reflection consistency is analyzed across frames
    - Then the system should flag the lack of reflection movement as a synthetic artifact.

# UI element
None. This is a background security check.

# Technical Notes (Architect)
- Use a temporal buffer of at least 5 frames to perform this analysis.
- Correlate specular movement with the `rollAngle`, `pitchAngle`, and `yawAngle` from MLKit.
- Artifacts should be added to the final `deepfakeScore`.

# Reviewer Feedback (Reviewer)

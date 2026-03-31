---
id: US-05-BIO-005
title: Biometric Verification Flow Integration
status: DONE
type: feature
---
# Description
As a verification system, I want to integrate matching logic into the authentication flow so that I can grant or deny access based on face similarity.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/verification-service.ts
> *   @src/features/camera/ScanScreen.tsx

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Identity Verified
    - Given a live embedding matches the stored template with score > 0.85
    - When verification is performed
    - Then the system should return "Verification Success".
- [ ] **Scenario 2:** Identity Denied (Mismatch)
    - Given a live embedding similarity score <= 0.85
    - When verification is performed
    - Then the system should return "Face Not Recognized".
- [ ] **Scenario 3:** UI Feedback for Verification
    - Given the verification result
    - When the result is processed
    - Then the ScanScreen should show a success animation or a red pulse for rejection as per UX Design.

# UI element
- **Screen:** Biometric Scanning (Shared Base) - Rejection/Success states.

# Technical Notes (Architect)
- Use `MatchingService` to perform the comparison.
- Ensure the 0.85 threshold is applied as per PRD Rule 5.

# Reviewer Feedback (Reviewer)

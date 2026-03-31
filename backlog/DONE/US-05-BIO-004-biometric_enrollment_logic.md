---
id: US-05-BIO-004
title: Biometric Enrollment Logic
status: DONE
type: feature
---
# Description
As an enrollment service, I want to verify liveness and deepfake probability before extracting and saving a biometric template so that only real, non-synthetic faces are enrolled.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/biometrics/enrollment-service.ts
> *   @src/features/verification/liveness/useLivenessMachine.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Successful Enrollment
    - Given Liveness Score > 0.9 and Deepfake Confidence Score < 0.1 (Consistency > 0.9)
    - When `enrollUser` is triggered
    - Then an embedding should be extracted and saved to secure storage.
- [x] **Scenario 2:** Rejection due to Low Liveness
    - Given Liveness Score <= 0.9
    - When `enrollUser` is triggered
    - Then enrollment should fail with a "Liveness Check Failed" error.
- [x] **Scenario 3:** Rejection due to Deepfake Risk
    - Given Deepfake Confidence Score >= 0.1 (PRD Rule 4 requires confidence score > 0.9 for success, which means Deepfake risk < 0.1)
    - When `enrollUser` is triggered
    - Then enrollment should fail with a "Security Risk Detected" error.

# Technical Notes (Architect)
- Coordinate between `useLivenessMachine`, `EmbeddingService`, and `KeychainService`.
- Follow PRD Rule 4: "Enrollment must only succeed if the Liveness and Deepfake confidence scores exceed 0.9."

# Reviewer Feedback (Reviewer)
The `EnrollmentService` implementation correctly enforces the PRD security rules (Rule 4). The orchestration between the model, embedding extraction, and secure storage is clean and efficient. Comprehensive unit tests verify both positive and negative scenarios, ensuring a reliable enrollment flow.

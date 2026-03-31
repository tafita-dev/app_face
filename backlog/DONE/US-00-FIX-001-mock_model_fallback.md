---
id: US-00-FIX-001
title: Mock Model Fallback for Development
status: DONE
type: hotfix
---
# Description
As a developer, I want the application to provide mock models if the TFLite files fail to load in development mode so that I can continue working on the UI and logic without valid model files.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/deepfake/hooks/useAntiDeepfakeModel.ts
> *   @src/features/verification/biometrics/hooks/useBiometricModel.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Model Loading Failure in Dev
    - Given the application is running in `__DEV__` mode
    - When a TFLite model fails to load
    - Then the system should log a warning and provide a functional mock model.
- [x] **Scenario 2:** Model Output from Mock
    - Given a mock model is active
    - When `model.run()` is called
    - Then it should return data in the expected format (e.g., scores for deepfake, embeddings for biometrics).
- [x] **Scenario 3:** Production Error Handling
    - Given the application is running in production mode
    - When a model fails to load
    - Then the system should set the `error` state and NOT provide a mock.

# Technical Notes (Architect)
- Use `__DEV__` global variable to distinguish environments.
- Ensure the mock `run` function returns the correct shape (nested arrays for TFLite outputs).

# Reviewer Feedback (Reviewer)
The fix is surgical and effectively unblocks development while maintaining strict error handling in production. Tests have been updated to cover the fallback logic.

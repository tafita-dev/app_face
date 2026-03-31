---
id: US-05-BIO-003
title: Secure Biometric Storage with Keychain
status: DONE
type: feature
---
# Description
As a user, I want my biometric data to be stored securely on my device using hardware-backed encryption so that my privacy is protected.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/services/security/keychain-service.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Secure Enrollment Storage
    - Given a biometric embedding
    - When `saveBiometricTemplate` is called
    - Then the data should be encrypted and stored in the Secure Enclave/TEE using `react-native-keychain`.
- [x] **Scenario 2:** Biometric-Locked Retrieval
    - Given a stored template
    - When `getBiometricTemplate` is called
    - Then it should require biometric authentication (FaceID/TouchID/Fingerprint) to decrypt and return the embedding.
- [x] **Scenario 3:** No Raw Image Storage
    - Given the enrollment process
    - When data is persisted
    - Then only the mathematical embedding must be stored, never raw pixel data (PRD Rule 3).

# Technical Notes (Architect)
- Use `react-native-keychain` with `ACCESS_CONTROL.BIOMETRY_ANY` or `BIOMETRY_CURRENT_SET`.
- Ensure the embedding is converted to a string format (e.g., Base64 or JSON) for storage.

# Reviewer Feedback (Reviewer)
The implementation of `KeychainService` is robust and follows the specified hardware-backed security protocols. Use of `BIOMETRY_CURRENT_SET` correctly ensures data invalidation upon biometric set changes, as required for high-security applications. The service is well-abstracted and follows the TDD pattern.

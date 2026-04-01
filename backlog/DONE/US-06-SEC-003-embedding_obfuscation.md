---
id: US-06-SEC-003
title: Biometric Embedding Obfuscation
status: DONE
type: feature
---
# Description
As a security service, I want to obfuscate face embeddings before saving them so that the raw data remains protected even if the secure storage is compromised.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/embedding-obfuscation.ts
> *   @src/services/security/keychain-service.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Successful Obfuscation on Save
    - Given a raw biometric embedding (Float32Array)
    - When `saveBiometricTemplate` is called
    - Then the data stored in the keychain should be transformed (not match the raw array).
- [x] **Scenario 2:** Successful De-obfuscation on Retrieval
    - Given an obfuscated embedding in the keychain
    - When `getBiometricTemplate` is called
    - Then it should return the original Float32Array accurately.
- [x] **Scenario 3:** Salt/Key Consistency
    - Given multiple save operations
    - When retrieving the data
    - Then the de-obfuscation must always yield the same result for the same input across sessions on the same device.

# Technical Notes (Architect)
- Use a simple but effective obfuscation technique like XOR with a device-derived salt.
- Do not store the salt directly; derive it from unique device IDs (e.g., `react-native-device-info`).
- Ensure no loss of precision during the transformation.

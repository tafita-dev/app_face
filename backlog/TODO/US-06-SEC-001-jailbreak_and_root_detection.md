---
id: US-06-SEC-001
title: Jailbreak and Root Detection
status: READY
type: feature
---
# Description
As a security service, I want to detect if the device is rooted or jailbroken so that I can prevent sensitive biometric operations on compromised hardware.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/device-integrity.ts
> *   @src/features/security/index.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Clean Device Detected
    - Given a non-rooted and non-jailbroken device
    - When checking device integrity
    - Then the system should return a "SAFE" status.
- [ ] **Scenario 2:** Rooted/Jailbroken Device Detected
    - Given a device that has been rooted or jailbroken
    - When checking device integrity
    - Then the system should return a "COMPROMISED" status.
- [ ] **Scenario 3:** Blocked Initialization
    - Given the device status is "COMPROMISED"
    - When the application starts the verification flow
    - Then the system should display a security warning and prevent further actions.

# Technical Notes (Architect)
- Use `react-native-jail-monkey` or a similar library to perform the checks.
- Integrate the check into the initial step of the `useLivenessMachine` or a global security guard.
- Ensure the check covers both Android (Root) and iOS (Jailbreak).

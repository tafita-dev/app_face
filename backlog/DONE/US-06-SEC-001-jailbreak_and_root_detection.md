---
id: US-06-SEC-001
title: Jailbreak and Root Detection
status: DONE
type: feature
---
# Description
As a security service, I want to detect if the device is rooted or jailbroken so that I can prevent sensitive biometric operations on compromised hardware.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/device-integrity.ts: Logic for checking device safety.
> *   @src/features/security/index.ts: Module entry point.
> *   @src/store/app-slice.ts: Update state to include device status.
> *   @src/features/camera/ScanScreen.tsx: Entry point for the check.

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
    - When the application starts the verification flow (ScanScreen)
    - Then the system should update `verificationStatus` to `SECURITY_RISK`, set an appropriate message, and trigger navigation to `SecurityAlert`.

# UI element
- **Screen:** Security Alert (Critical) - Reuse existing component.
- **Message:** "Device Integrity Compromised. For your security, biometric authentication is disabled on rooted or jailbroken devices."

# Technical Notes (Architect)
- Install `react-native-jail-monkey`.
- Create `src/features/security/device-integrity.ts`:
    - Implement `checkDeviceIntegrity()`:
        - Check `JailMonkey.isJailBroken()`.
        - Check `JailMonkey.canMockLocation()`.
        - Check `JailMonkey.trustFall()`.
        - Return `COMPROMISED` if any of these are true.
- Update `src/store/app-slice.ts`:
    - Add `deviceStatus: 'SAFE' | 'COMPROMISED' | 'UNKNOWN'` to `AppState`.
    - Add `setDeviceStatus` reducer.
- Update `src/features/camera/ScanScreen.tsx`:
    - Call `checkDeviceIntegrity` in a `useEffect` on mount.
    - If `COMPROMISED`, dispatch `setDeviceStatus('COMPROMISED')` and `setVerificationResult({ status: 'SECURITY_RISK', message: '...' })`.
- Ensure tests mock `JailMonkey` behaviors.

# Reviewer Feedback (Reviewer)

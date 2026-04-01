---
id: US-06-SEC-002
title: Screen Capture Protection
status: DONE
type: feature
---
# Description
As a security-conscious user, I want the application to prevent screen recording and screenshots so that my biometric data remains private during the verification process.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/hooks/useScreenProtection.ts
> *   @src/features/camera/ScanScreen.tsx
> *   @src/features/security/index.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1:** Active Screen Recording Blocked
    - Given a screen recording is active on the device
    - When the user navigates to the ScanScreen
    - Then the system should display a message "Screen recording detected. Please stop it to continue" and obscure the camera view.
- [x] **Scenario 2:** Snapshot Prevention (Android)
    - Given the application is on the ScanScreen
    - When the user attempts to take a screenshot
    - Then the system should prevent the action (the resulting image should be black or the OS should block the capture).
- [x] **Scenario 3:** Snapshot Notification (iOS)
    - Given the application is on the ScanScreen
    - When the user takes a screenshot
    - Then the system should detect the event and log it or notify the user of the security risk.

# Technical Notes (Architect)
- **Library Selection:** Use `react-native-screen-guard` (requires native linking for some OS features).
- **Architecture:** 
    - Implement a custom hook `useScreenProtection` in `src/features/security/hooks/useScreenProtection.ts`.
    - Provide a reactive state `isRecording` to the consuming component.
    - On Android, the library handles `FLAG_SECURE` window property automatically when protection is active.
    - On iOS, listen for `UIScreenCapturedDidChange` and `userDidTakeScreenshotNotification` through the library's listeners.
- **UI (ScanScreen.tsx):** 
    - When `isRecording` is true, display a semi-transparent blur overlay (`Glassmorphism Blur`) with a warning message.
    - Ensure the camera stream is completely obscured.
- **Testing Strategy:**
    - Unit test for `useScreenProtection` hook using mock for `react-native-screen-guard`.
    - Integration test in `ScanScreen.test.tsx` to verify overlay visibility when protection triggers.

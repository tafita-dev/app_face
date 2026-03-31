---
id: US-06-SEC-002
title: Screen Capture Protection
status: READY
type: feature
---
# Description
As a security-conscious user, I want the application to prevent screen recording and screenshots so that my biometric data remains private during the verification process.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/screen-protection.ts
> *   @src/features/camera/ScanScreen.tsx

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Active Screen Recording Blocked
    - Given a screen recording is active on the device
    - When the user navigates to the ScanScreen
    - Then the system should display a message "Screen recording detected. Please stop it to continue" and obscure the camera view.
- [ ] **Scenario 2:** Snapshot Prevention (Android)
    - Given the application is on the ScanScreen
    - When the user attempts to take a screenshot
    - Then the system should prevent the action (the resulting image should be black or the OS should block the capture).
- [ ] **Scenario 3:** Snapshot Notification (iOS)
    - Given the application is on the ScanScreen
    - When the user takes a screenshot
    - Then the system should detect the event and log it or notify the user of the security risk.

# Technical Notes (Architect)
- Use `react-native-screen-guard` or `react-native-screenshot-prevent`.
- On Android, use the `FLAG_SECURE` window property.
- On iOS, listen for the `UIScreenCapturedDidChange` notification for recording and `userDidTakeScreenshotNotification` for screenshots.

---
id: US-01-INFRA-002
title: Camera Permission Handling & Authorization Flow
status: IN_PROGRESS
type: feature
---
# Description
As a User, I want the application to request and handle camera permissions gracefully so that I understand why the permission is needed and what to do if I deny it.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/features/auth/`
> * `src/hooks/useCameraPermissions.ts`

# Acceptance Criteria (DoD)
- [ ] **Scenario 1:** First-time permission request
    - Given the user has not granted camera permissions
    - When they navigate to the scanning screen
    - Then they should see a rationale/welcome screen and a system permission prompt.
- [ ] **Scenario 2:** Permission denied
    - Given the user denies the camera permission
    - When they attempt to scan
    - Then they should see a clear explanation and a button to open System Settings.
- [ ] **Scenario 3:** Permission granted
    - Given the user grants camera permissions
    - When they navigate to the scanning screen
    - Then the camera preview should initialize without further prompts.

# UI element
- Permission Rationale Screen (Welcome Screen from UX Design Flow A).
- Error State: "Camera Access Required" with a "Go to Settings" button.

# Technical Notes (Architect)
- Use `react-native-vision-camera`'s `requestCameraPermission()` and `getCameraPermissionStatus()`.
- Handle `denied` and `blocked` (permanently denied) states differently.

# Reviewer Feedback (Reviewer)

---
id: US-07-HOTFIX-001
title: Emergency Hotfix - ScreenGuard Initialization Error
status: DONE
type: hotfix
---

# Description
Fix the "ScreenGuard is not initialized. Please call initSettings() first!" error occurring during application startup.

# Acceptance Criteria
- [x] Application initializes ScreenGuard globally at startup.
- [x] `useScreenProtection` hook handles initialization and registration robustly.
- [x] Unit tests for `useScreenProtection` are updated to match the correct library implementation and pass successfully.

# Implementation Details
- Added `ScreenGuard.initSettings()` to `index.js`.
- Updated `useScreenProtection.ts` to use async registration and improved error handling.
- Corrected package name and method mocks in `useScreenProtection.test.ts`.

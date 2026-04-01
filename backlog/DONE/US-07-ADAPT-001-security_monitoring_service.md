---
id: US-07-ADAPT-001
title: Security Monitoring Service
status: DONE
type: feature
---
# Description
As a security service, I want to continuously monitor device health (battery, thermal state) and security context so that the system can adapt the verification rigor to the current risk level.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/adaptive-security-service.ts
> *   @src/features/security/hooks/useAdaptiveSecurity.ts
> *   @src/store/app-slice.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Monitor High-Risk Context**
    - Given the device is in a 'COMPROMISED' state or screen recording is active
    - When the security service evaluates the risk level
    - Then it should return a 'HIGH_RISK' context status.
- [ ] **Scenario 2: Monitor Environmental Stability**
    - Given the device thermal state is critical or battery is extremely low (<5%)
    - When a verification is initiated
    - Then the system should flag the environment as 'UNSTABLE' to prevent processing errors.
- [ ] **Scenario 3: Integration with Redux**
    - Given a change in security context (e.g., Recording started)
    - When the service detects it
    - Then it should update the `app` slice with the latest `securityContext`.

# Technical Notes (Architect)
- **Data Source:** Use `react-native-device-info` for `getBatteryLevel`, `isBatteryCharging`, and `getPowerState`. Note: Thermal state API may vary by OS; if unavailable, focus on battery and charging state as primary "stability" indicators.
- **Singleton Pattern:** Implement `AdaptiveSecurityService` in `src/features/security/adaptive-security-service.ts`. It should export an `evaluateSecurityContext()` method.
- **State Integration:** 
    - Update `AppState` in `src/store/app-slice.ts` to include `securityContext: 'NORMAL' | 'HIGH_RISK' | 'UNSTABLE'`.
    - Add a `setSecurityContext` reducer.
- **Hook:** Create `useAdaptiveSecurity` hook to subscribe to these changes in the UI.
- **TDD:** Mock `react-native-device-info` in tests. Verify that `evaluateSecurityContext` correctly aggregates `DeviceIntegrity` (from US-06-SEC-001) and `ScreenProtection` (from US-06-SEC-002).

# UI element
- No new screens, but `ScanScreen.tsx` should display a "Low Battery/Unstable Environment" warning if `securityContext === 'UNSTABLE'`.
- If `securityContext === 'HIGH_RISK'`, ensure existing security alert logic is triggered.

---
id: US-06-SEC-004
title: Biometric Authentication Lockout
status: READY
type: feature
---
# Description
As a security service, I want to implement a lockout mechanism after multiple failed attempts so that I can mitigate brute-force attacks on the face matching system.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/security/lockout-service.ts
> *   @src/store/app-slice.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1:** Tracking Failures
    - Given a failed face verification
    - When `verifyIdentity` returns status 'FAILURE'
    - Then the fail counter should be incremented.
- [ ] **Scenario 2:** Lockout Triggered
    - Given 5 consecutive failed verification attempts
    - When the 6th attempt is initiated
    - Then the system should return a "LOCKOUT" status and prevent the verification process.
- [ ] **Scenario 3:** Successful Reset
    - Given a successful face verification (similarity > 0.85)
    - When the result is processed
    - Then the fail counter should be reset to zero.
- [ ] **Scenario 4:** Temporary Lockout Duration (Bonus/Assumption)
    - Given a "LOCKOUT" status is active
    - When 15 minutes have passed
    - Then the system should reset the counter and allow verification again.

# Technical Notes (Architect)
- Persist the fail counter in `AsyncStorage` or Redux (if persistent) to survive app reloads.
- Add a `lastFailedTimestamp` to handle the lockout duration.
- Update the `app-slice.ts` to reflect the "LOCKOUT" status.

---
id: US-07-ADAPT-004
title: Dynamic Security Thresholding (DST)
status: DONE
type: feature
---
# Description
As a matching service, I want to dynamically adjust the Cosine Similarity threshold based on the security context and environment so that I can balance security and user friction.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/verification-service.ts
> *   @src/features/security/adaptive-security-service.ts

# Acceptance Criteria (DoD)

- [x] **Scenario 1: High Security Mode**
    - Given a 'HIGH_RISK' security context (e.g., device compromised) or 'Low Light' environment
    - When `verifyIdentity` is called
    - Then the similarity threshold should be increased to 0.90 (from 0.85).
- [x] **Scenario 2: Normal Mode**
    - Given a 'SAFE' device and 'Optimal Light'
    - When `verifyIdentity` is called
    - Then the default threshold of 0.85 should be applied.
- [x] **Scenario 3: Successful Verification under DST**
    - Given a similarity score of 0.87
    - When in 'Normal Mode'
    - Then the status should be 'SUCCESS'.
- [x] **Scenario 4: Rejection under DST**
    - Given a similarity score of 0.87
    - When in 'High Security Mode' (Threshold 0.90)
    - Then the status should be 'FAILURE'.

# Technical Notes (Architect)
- The `verification-service` should query `AdaptiveSecurityService.getRequiredThreshold()` before performing the match.

# Product Epics (Roadmap)

## Epic 1: Core Camera & Vision Infrastructure
- **Goal:** Setup React Native project with Vision Camera and basic frame processing.
- **Status:** DONE
- **Ref:** @specs/01-PRD.md#feature-real-time-face-detection

## Epic 2: Face Detection & Landmark Tracking
- **Goal:** Implement on-device face detection using MLKit and visualize landmarks with Skia.
- **Status:** DONE
- **Ref:** @specs/01-PRD.md#feature-real-time-face-detection

## Epic 3: Liveness Detection (Active & Passive)
- **Goal:** Implement blink detection, head movement tracking, and texture analysis.
- **Status:** DONE
- **Ref:** @specs/01-PRD.md#feature-multi-modal-liveness-detection

## Epic 4: Anti-Deepfake Analysis
- **Goal:** Integrate TFLite models for detecting synthetic artifacts in video frames and analyze temporal consistency.
- **Status:** DONE
- **Ref:** @specs/01-PRD.md#feature-anti-deepfake-analysis

## Epic 5: Biometric Enrollment & Verification
- **Goal:** Implement embedding extraction and secure local matching.
- **Status:** DONE
- **Ref:** @specs/01-PRD.md#feature-secure-biometric-matching

## Epic 6: Security & Hardening
- **Goal:** Implement secure storage, anti-tampering, and production-ready security layers.
- **Sub-goals:**
    - Implement Jailbreak/Root detection (e.g., using `react-native-jail-monkey` or custom native modules).
    - Implement Screen Recording & Screenshot protection (using `react-native-screen-guard`).
    - Obfuscate mathematical embeddings before storage (additional encryption layer).
    - Implement biometric lockout (too many failed attempts).
- **Status:** DONE
- **Ref:** @specs/03-ARCHITECTURE.md#8-coding-standards--best-practices

## Epic 7: Adaptive Verification & Runtime Security
- **Goal:** Implement the Adaptive Security Engine to dynamically adjust thresholds and challenges.
- **Sub-goals:**
    - Develop `SecurityService` to monitor device health and environment.
    - Implement "Ambient Light Analysis" in the frame processor to estimate lux levels.
    - Implement "Challenge Orchestrator" for randomizing active liveness tasks.
    - Develop the "Dynamic Security Thresholding" (DST) logic to adjust Cosine Similarity thresholds.
- **Status:** DONE
- **Ref:** @specs/03-ARCHITECTURE.md#5-adaptive-security-engine

## Epic 8: End-to-End Testing & Production Readiness
- **Goal:** Ensure the system is robust, performant, and ready for production deployment.
- **Sub-goals:**
    - Implement E2E tests for the full Enrollment and Authentication flows.
    - Performance benchmarking (ensure < 2s verification time).
    - Setup CI/CD pipeline for automated testing and builds.
    - Implement centralized error logging (production-ready).
- **Status:** TODO
- **Ref:** @specs/01-PRD.md#3-non-functional-requirements

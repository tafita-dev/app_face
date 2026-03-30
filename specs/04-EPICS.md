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
- **Sub-goals:**
    - Integrate `react-native-fast-tflite` for high-performance inference.
    - Implement frequency-domain analysis (FFT) on frame regions.
    - Implement temporal consistency checks (edge artifacts, specular highlight consistency).
    - Aggregate deepfake scores into the Liveness State Machine.
- **Status:** WIP
- **Ref:** @specs/01-PRD.md#feature-anti-deepfake-analysis

## Epic 5: Biometric Enrollment & Verification

- **Goal:** Implement embedding extraction and secure local matching.
- **Status:** BACKLOG
- **Ref:** @specs/01-PRD.md#feature-secure-biometric-matching

## Epic 6: Security & Hardening

- **Goal:** Implement secure storage, anti-tampering, and production-ready security layers.
- **Status:** BACKLOG
- **Ref:** @specs/03-ARCHITECTURE.md#coding-standards--best-practices


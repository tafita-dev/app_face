# Product Context
> **Note:** This file defines "What the application is" and "How it works globally". It acts as the primary context for the AI Developer.

## 1. Project Identity
*   **Name:** AureliusSecureFace
*   **Core Value:** Secure biometric authentication with advanced liveness detection and anti-deepfake protection.
*   **Target Audience:** Financial institutions, high-security enterprise apps, and privacy-focused developers.

## 2. High-Level Architecture
*   **Type:** Mobile Application (React Native CLI)
*   **Tech Stack:**
    *   Frontend: React Native, TypeScript, Redux Toolkit (State Management)
    *   Camera/Vision: `react-native-vision-camera`, `react-native-skia` (for overlays)
    *   AI/ML: MLKit (On-device Face Detection), TensorFlow Lite (Custom Deepfake Detection models)
    *   Security: `react-native-keychain` (Secure storage for tokens/hashes)
*   **Key Patterns:** Feature-based modularity, Clean Architecture (Domain/Data/Presentation layers), Repository Pattern for data fetching.

## 3. Core Domain Flows
1.  **Identity Enrollment:** User scans their face -> System extracts biometric landmarks -> System verifies liveness -> Securely stores encrypted face embedding.
2.  **Secure Authentication:** User presents face -> System performs real-time liveness check -> System runs anti-deepfake analysis -> System matches against stored embedding -> Access Granted/Denied.
3.  **Deepfake/Spoof Alert:** System detects a digital replay or AI-generated face -> System logs the attempt and freezes authentication -> User is notified of a security risk.

# Technical Architecture

## 1. Tech Stack
*   **Framework:** React Native 0.73+ (CLI)
*   **Language:** TypeScript 5+
*   **Native Modules:** JSI (JavaScript Interface) for high-performance frame processing.
*   **Camera:** `react-native-vision-camera` (v4+) for Frame Processor support.
*   **AI Engine:** Google MLKit (Face Detection), TensorFlow Lite (Custom models).
*   **UI/UX:** `react-native-reanimated` for smooth feedback animations, `react-native-skia` for real-time graphics.

## 2. Native Frame Processing Strategy
*   **Engine:** `react-native-vision-camera` (v4) + `react-native-worklets-core`.
*   **Architecture:**
    *   **Worklet Thread:** Heavy frame analysis (MLKit, TFLite) runs on the dedicated worklet thread.
    *   **Unified Face Processor:** A single JSI-based processor handles both Face Detection and Landmark Tracking in a single pass to minimize latency.
    *   **JSI Modules:** Custom native frame processors are used to bridge Vision Camera's `Frame` objects to MLKit and TFLite without bridge serialization.
    *   **Feedback Loop:** Detection results (landmarks, liveness scores) are passed back to the JS thread via Reanimated Shared Values for zero-lag UI updates (Skia overlays).

## 3. Face Data Schema
To ensure consistency across the application, all face detection modules must return data following this interface:

```typescript
interface IFaceLandmark {
  x: number;
  y: number;
}

interface IFaceDetection {
  bounds: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  landmarks: {
    leftEye?: IFaceLandmark;
    rightEye?: IFaceLandmark;
    noseBase?: IFaceLandmark;
    mouthBottom?: IFaceLandmark;
    mouthLeft?: IFaceLandmark;
    mouthRight?: IFaceLandmark;
    // ... add other MLKit landmarks as needed
  };
  contours?: Record<string, IFaceLandmark[]>;
  rollAngle: number;
  pitchAngle: number;
  yawAngle: number;
  livenessScore?: number; // Calculated later in Epic 3
}
```

## 4. Directory Structure
```text
src/
├── api/             # API clients and data fetching
├── assets/          # Images, fonts, and local ML models
├── components/      # Shared UI components (Atomic Design)
├── features/        # Feature-based modules
│   ├── auth/        # Login/Enrollment logic
│   ├── camera/      # Vision Camera wrappers and Frame Processors
│   │   ├── components/      # Camera-specific UI (FaceGuide, etc.)
│   │   ├── frame-processors/# JSI worklets for ML processing
│   │   └── hooks/           # useCamera, useFaceDetection
│   └── verification/# Liveness and Anti-Deepfake logic
├── hooks/           # Custom React hooks (useAppState, usePermissions)
├── navigation/      # React Navigation setup
├── store/           # Redux Toolkit slices and store config
├── services/        # Singleton services (Storage, Security)
├── theme/           # Design system (Colors, Spacing, Typography)
└── utils/           # Helper functions
```

## 3. Naming Conventions
*   **Files:** `kebab-case.ts` for utilities, `PascalCase.tsx` for components.
*   **Variables/Functions:** `camelCase`.
*   **Constants:** `UPPER_SNAKE_CASE`.
*   **Interfaces/Types:** `PascalCase`, prefixed with `I` (optional, but consistent).

## 4. Coding Standards & Best Practices
*   **Clean Code:** Follow SOLID principles. Keep components under 200 lines.
*   **Type Safety:** Strict TypeScript configuration. Avoid `any`.
*   **Performance:** Use `useCallback` and `useMemo` strategically. Minimize bridge traffic; use JSI for heavy lifting.
*   **Security:** Sanitize all inputs. Encrypt sensitive data at rest using `react-native-keychain`.
*   **Testing:** Jest for unit tests, React Native Testing Library for components, Detox for E2E.

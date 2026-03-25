# Technical Architecture

## 1. Tech Stack
*   **Framework:** React Native 0.73+ (CLI)
*   **Language:** TypeScript 5+
*   **Native Modules:** JSI (JavaScript Interface) for high-performance frame processing.
*   **Camera:** `react-native-vision-camera` (v4+) for Frame Processor support.
*   **AI Engine:** Google MLKit (Face Detection), TensorFlow Lite (Custom models).
*   **UI/UX:** `react-native-reanimated` for smooth feedback animations, `react-native-skia` for real-time graphics.

## 2. Directory Structure
```text
src/
├── api/             # API clients and data fetching
├── assets/          # Images, fonts, and local ML models
├── components/      # Shared UI components (Atomic Design)
├── features/        # Feature-based modules
│   ├── auth/        # Login/Enrollment logic
│   ├── camera/      # Vision Camera wrappers and Frame Processors
│   └── verification/# Liveness and Anti-Deepfake logic
├── hooks/           # Custom React hooks
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

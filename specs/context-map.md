# Context Map
> **Note:** This file maps Business Features to Source Code. The Architect updates this when files are added/moved. Use this to find where code lives without searching.

## Feature Map

| Feature / Module | Key Files / Directories | Entry Point |
| :--- | :--- | :--- |
| **Auth / Enrollment** | `src/features/auth/` | `src/features/auth/index.ts` |
| **Camera & Vision** | `src/features/camera/`, `android/app/src/main/java/.../vision/` | `src/features/camera/CameraView.tsx` |
| **Verification Logic** | `src/features/verification/` | `src/features/verification/verification-service.ts` |
| **ML Models & Assets** | `src/assets/models/` | `src/assets/index.ts` |
| **State Management** | `src/store/` | `src/store/index.ts` |
| **Secure Storage** | `src/services/security/` | `src/services/security/keychain-service.ts` |
| **Shared Components** | `src/components/` | `src/components/index.ts` |
| **Navigation** | `src/navigation/` | `src/navigation/root-navigator.tsx` |

## Dependency Graph
*   `src/features/auth` depends on `src/features/verification` and `src/services/security`.
*   `src/features/verification` depends on `src/features/camera` (Frame Processor data).
*   `src/features/camera` depends on `src/components` (for Skia overlays).
*   All features depend on `src/store` for global state and `src/theme` for styling.

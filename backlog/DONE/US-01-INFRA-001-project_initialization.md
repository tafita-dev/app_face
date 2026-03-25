---
id: US-01-INFRA-001
title: Project Initialization & Core State Management
status: DONE
type: feature
---
# Description
As a Developer, I want to initialize the React Native project with TypeScript, Redux Toolkit, and the base directory structure so that the team can start developing features in a consistent environment.

# Context Map
> Reference @specs/context-map.md
> Specific files for this story:
> * `src/store/index.ts` (Store configuration)
> * `src/store/root-reducer.ts` (Reducer combination)
> * `src/navigation/root-navigator.tsx` (Main navigation container)
> * `src/theme/index.ts` (Theme provider and constants)
> * `src/features/` (Base feature directory structure)

# Acceptance Criteria (DoD)
- [ ] **Scenario 1:** Project setup validation
    - Given a fresh environment
    - When the project is initialized and `npm start` is run
    - Then the application should build successfully and show a base screen.
- [ ] **Scenario 2:** State Management readiness
    - Given the Redux Toolkit configuration
    - When a test action is dispatched
    - Then the global state should update correctly according to the reducer logic.
- [ ] **Scenario 3:** TypeScript Strictness
    - Given the `tsconfig.json`
    - When running `tsc`
    - Then no type errors should be present in the initial codebase.

# UI element
### Welcome Screen (Initial Branding)
*   **Background:** Deep Navy (#0A0E1A)
*   **Elements:** 
    *   Central Logo placeholder (Skia geometric shape or simple Icon).
    *   "AureliusSecureFace" title in Electric Blue (#007AFF).
    *   Sub-label: "Secure Biometric Intelligence".
*   **Navigation:** Initial route should be this Welcome Screen within a `createStackNavigator`.

# Technical Notes (Architect)
- **Framework:** Initialize using `npx react-native@latest init AureliusSecureFace --template react-native-template-typescript`.
- **Folder Structure:** Create all directories specified in `specs/03-ARCHITECTURE.md` Section 2.
- **Redux Toolkit:** 
    - Use `@reduxjs/toolkit` and `react-redux`.
    - Setup a sample `appSlice` to verify state connectivity.
- **Navigation:** Install `@react-navigation/native` and `@react-navigation/stack`.
- **Theme:** Implement a simple `ThemeProvider` (or a constant-based theme object) using the colors defined in `specs/02-UX-DESIGN.md`.
- **Linting/Formatting:** Ensure `.eslintrc.js` and `.prettierrc.js` are configured to enforce clean code standards.

# Reviewer Feedback (Reviewer)

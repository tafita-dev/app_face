---
id: US-03-LIVE-005
title: Liveness User Interface Feedback
status: DONE
type: feature
---

# Description
As a user, I want clear visual instructions and progress feedback during the liveness check so that I know exactly what to do to complete the process.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/camera/components/FaceGuide.tsx (Updating colors/states)
> *   @src/features/camera/ScanScreen.tsx

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Challenge Prompts**
    - Given the state is `CHALLENGE_BLINK`
    - When the UI renders
    - Then a large instruction text "Blink your eyes" is displayed at the bottom.

- [ ] **Scenario 2: Progress Indicator**
    - Given the user is performing challenges
    - When a challenge is completed
    - Then a progress bar at the top fills proportionally (e.g., 33% per challenge if there are 3).

- [ ] **Scenario 3: Failure State UI**
    - Given a challenge times out or fails
    - When the UI updates
    - Then the `FaceGuide` (oval) turns Red and shows "Try again".

# UI element
- Large Instruction Label (Bottom).
- Progress Bar (Top).
- FaceGuide color state: Blue (Positioning), Green (Challenge Active), Red (Failure).

# Technical Notes (Architect)
- Use `react-native-reanimated` to animate the progress bar.
- Interface with `useLivenessMachine` to drive the UI states.

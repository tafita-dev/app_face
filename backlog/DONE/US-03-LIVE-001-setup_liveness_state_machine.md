---
id: US-03-LIVE-001
title: Setup Liveness State Machine
status: DONE
type: feature
---

# Description
As a Security System, I want to manage the liveness detection flow through a strict state machine so that I can ensure the user follows the correct sequence of positioning and challenges.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/useLivenessMachine.ts (New Hook)
> *   @src/features/camera/hooks/useFaceDetection.ts (Source of validPosition)
> *   @specs/03-ARCHITECTURE.md (Liveness State Machine definition)

# Acceptance Criteria (DoD)

- [x] **Scenario 1: Initial State**
    - Given the camera is initialized
    - When the liveness flow starts
    - Then the state is set to `POSITIONING`.

- [x] **Scenario 2: Transition to Challenge**
    - Given the state is `POSITIONING`
    - When the `face.validPosition` (from useFaceDetection) is true for 1.5 seconds
    - Then the state transitions to the first random challenge (e.g., `CHALLENGE_BLINK`).

- [x] **Scenario 3: State Reset on Face Loss**
    - Given the state is in any `CHALLENGE` state
    - When the face is lost or becomes invalid (`validPosition` is false)
    - Then the state resets to `POSITIONING`.

- [x] **Scenario 4: Completion to Analysis**
    - Given all required challenges are met
    - When the last challenge is completed
    - Then the state transitions to `ANALYZING`.

# UI element
- This hook will drive the state of `FaceGuide` (color) and `ScanScreen` (instruction label).
- **State -> UI Mapping**:
  - `POSITIONING`: Blue Guide, "Center your face".
  - `CHALLENGE_*`: Green Guide, Challenge-specific text (e.g., "Blink now").
  - `ANALYZING`: Pulsing Blue/Green, "Analyzing security...".
  - `FAILURE`: Red Guide, "Liveness check failed".

# Technical Notes (Architect)
- **Directory**: Create `src/features/verification/liveness/` if it doesn't exist.
- **Implementation**: Use a custom hook `useLivenessMachine` that encapsulates the state logic. A `useReducer` is preferred for clarity over multiple `useState` calls.
- **Stability Timer**: Use a local `useEffect` or a Reanimated `useAnimatedReaction` to track `validPosition` and trigger the 1.5s timer before moving to `CHALLENGE_BLINK`.
- **Reanimated Integration**: Since `validPosition` is a `DerivedValue`, use `useAnimatedReaction` within the hook to trigger state transitions in the JS thread when conditions are met.
- **Randomization**: For now, hardcode the sequence (Blink -> Smile -> Rotation) but design the state machine to eventually support randomized challenges.

# Reviewer Feedback

- **Reanimated Integration Success**: The hook now correctly takes a `ReadonlySharedValue<boolean>` and uses `useAnimatedReaction` with `runOnJS` to drive the state machine logic on the JS thread.
- **Functional Logic Corrected**: The 1.5s stability timer and reset logic are correctly triggered by the SharedValue's changes.
- **Tests Updated**: Tests correctly mock Reanimated's behavior and verify the integration.
- **Success**: Code is clean, follows SOLID principles and project architecture.

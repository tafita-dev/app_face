---
id: US-07-ADAPT-003
title: Active Challenge Randomization
status: READY
type: feature
---
# Description
As a liveness engine, I want to randomize the sequence of active challenges so that I can prevent replay attacks using pre-recorded videos.

# Context Map
> Reference @specs/context-map.md to find file paths.
> Specific files for this story:
> *   @src/features/verification/liveness/useLivenessMachine.ts
> *   @src/features/verification/liveness/challenge-orchestrator.ts

# Acceptance Criteria (DoD)

- [ ] **Scenario 1: Randomized Sequence Generation**
    - Given a new liveness session starts
    - When the state machine initializes
    - Then it should generate a random sequence of at least 2 challenges (e.g., Blink -> Turn Left).
- [ ] **Scenario 2: Prevention of Static Sequences**
    - Given multiple consecutive liveness sessions
    - When sequences are generated
    - Then the sequence should vary between sessions (not be the same 3 times in a row).
- [ ] **Scenario 3: Adaptive Challenges**
    - Given the `deepfakeScore` is suspicious (0.5 to 0.8)
    - When the liveness check is in progress
    - Then the orchestrator should inject an additional "Head Rotation" challenge to increase confidence.

# Technical Notes (Architect)
- Refactor `livenessReducer` to accept a dynamic sequence instead of a hardcoded enum transition.
- Use `Math.random()` seeded by session ID for reproducibility in logs.

# UX/UI Design Specs

## 1. Global Layout & Theme
*   **Theme:** High-trust, Minimalist, Dark/Security-focused.
*   **Primary Colors:** Deep Navy (#0A0E1A), Electric Blue (#007AFF), Security Green (#34C759), Warning Red (#FF3B30).
*   **Typography:** Sans-serif (Inter or San Francisco), clear hierarchy.
*   **Global Components:**
    *   **StatusBar:** Hidden or transparent during camera sessions.
    *   **Top Header:** Only for navigation (Back button) when not in a scanning session.

## 2. User Flows

### Flow A: Identity Enrollment
1.  **Welcome Screen:** Intro to Secure Face ID -> User clicks "Start Enrollment".
2.  **Permission Request:** System requests Camera access -> User grants.
3.  **Positioning:** Camera view with a "Face Guide" (oval overlay).
4.  **Landmark Check:** Real-time feedback ("Center your face", "Hold still").
5.  **Liveness Tasks:** Active challenge (e.g., "Blink slowly") -> Progress bar fills.
6.  **Processing:** Spinner with "Analyzing Security..." text.
7.  **Success:** Checkmark animation -> Proceed to App.

### Flow B: Secure Authentication
1.  **Trigger:** App requires unlock or sensitive action.
2.  **Instant Scanning:** Camera opens immediately with Face Guide.
3.  **Passive Check:** Deepfake and Liveness analysis happens in the background.
4.  **Result:**
    *   **Success:** Vibration haptic + screen fades to content.
    *   **Rejection:** Red pulse on the guide -> "Face not recognized".
    *   **Deepfake/Spoof Alert:** Explicit warning screen -> "Security risk detected".

## 3. Screen Descriptions

### Screen: Biometric Scanning (Shared Base)
*   **Route:** `/auth/scan`
*   **Elements:**
    *   **Camera Preview:** Full-screen background.
    *   **Face Guide:** A dynamic Skia-rendered oval. Changes color (Blue: Idle, Green: Valid position, Red: Issue).
    *   **Status Label:** Large, bold text at the top (e.g., "Scanning...").
    *   **Instruction Text:** Smaller text at the bottom (e.g., "Blink your eyes").
    *   **Security Badge:** A small "Securely processing on-device" icon at the very bottom.
*   **Interactions:**
    *   **Face Detected** -> Guide turns Green, begins Liveness task.
    *   **Task Success** -> Progress bar fills, "Analyzing..." state triggered.
    *   **Face Lost** -> Guide turns Blue, show "Keep face in frame".

### Screen: Processing State
*   **Route:** Overlay on `/auth/scan`
*   **Elements:**
    *   **Glassmorphism Blur:** Semi-transparent blur over the camera preview.
    *   **Animated Pulse:** Central geometric shape pulsing.
    *   **Dynamic Labels:** Rotates through "Analyzing texture...", "Verifying liveness...", "Checking deepfake artifacts...".

### Screen: Security Alert (Critical)
*   **Route:** `/auth/alert`
*   **Elements:**
    *   **Icon:** Large Red Warning Triangle.
    *   **Heading:** "Authentication Blocked".
    *   **Description:** "A potential security risk (synthetic image or digital replay) was detected. For your safety, access is temporarily restricted."
    *   **Actions:** "Try Again" (if low confidence) or "Contact Support" (Primary Action).

## 4. Feedback Logic
*   **Haptics:**
    *   Selection: Light tap when landmark is first locked.
    *   Success: Double tap on verification.
    *   Failure: Triple heavy pulse on rejection.
*   **Transitions:**
    *   Fade-in for all modal overlays.
    *   Smooth scaling for the Face Guide when it expands/contracts to fit the face.

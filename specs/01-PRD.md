# Product Requirement Document (PRD)

## 1. Functional Specifications

### Feature: Real-time Face Detection
*   **Rule 1:** Must detect a single face in the camera view within 200ms.
*   **Rule 2:** Must track face landmarks (eyes, nose, mouth) in real-time.
*   **Rule 3:** Feedback should be provided to the user (e.g., "Move closer", "Center your face").

### Feature: Multi-Modal Liveness Detection
*   **Rule 1 (Passive):** Analyze texture and depth (if available) to detect 2D screen or paper replays.
*   **Rule 2 (Active):** Prompt the user for a random action (e.g., "Blink twice", "Turn head left") to ensure real-time interaction.
*   **Rule 3 (Temporal):** Analyze frame-to-frame consistency to detect abrupt AI-generated transitions.

### Feature: Anti-Deepfake Analysis
*   **Rule 1:** Analyze frequency domains for GAN-generated artifacts.
*   **Rule 2:** Detect "ghosting" or unnatural blending around the face edges.
*   **Rule 3:** Verify pulse-based liveness (rPPG) if camera quality permits.

### Feature: Secure Biometric Matching
*   **Rule 1:** Convert face images into non-reversible mathematical embeddings.
*   **Rule 2:** Compare live embeddings with stored templates using a configurable similarity threshold.
*   **Rule 3:** Never store the actual face image.

## 2. Data Dictionary
*   **Biometric Embedding:** A high-dimensional vector representing unique facial features.
*   **Liveness Score:** A probability value (0.0 to 1.0) indicating the likelihood that the subject is a real human.
*   **Deepfake Probability:** A score indicating the likelihood that the input is synthetically generated.

## 3. Non-Functional Requirements
*   **Performance:** Liveness and deepfake checks must complete in under 2 seconds on modern devices (iPhone 12+, Pixel 6+).
*   **Security:** Use Trusted Execution Environment (TEE) or Secure Enclave where possible for cryptographic operations.
*   **Reliability:** Work in various lighting conditions (50 lux to 10000 lux).

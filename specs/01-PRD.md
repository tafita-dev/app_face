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
*   **Rule 1:** Analyze frequency domains for GAN-generated artifacts using custom TFLite models.
*   **Rule 2:** Detect "ghosting" or unnatural blending around the face edges (temporal edge analysis).
*   **Rule 3:** Analyze specular highlights and eye reflections for consistency across multiple frames.
*   **Rule 4:** Provide a "Deepfake Confidence Score" (0.0 to 1.0) for each verified session.

### Feature: Secure Biometric Matching
*   **Rule 1:** Convert face images into non-reversible mathematical embeddings using a specialized TFLite model (e.g., FaceNet or MobileFaceNet).
*   **Rule 2:** Compare live embeddings with stored templates using Cosine Similarity or Euclidean distance with a configurable similarity threshold.
*   **Rule 3:** Never store the actual face image or raw pixel data.
*   **Rule 4:** Enrollment must only succeed if the Liveness and Deepfake confidence scores exceed 0.9.
*   **Rule 5:** Verification must return a "Match" status only if the similarity score is above the security threshold (default 0.85).
*   **Rule 6:** Stored embeddings must be encrypted with a device-specific key from the Secure Enclave/TEE.

## 2. Data Dictionary
*   **Biometric Embedding:** A high-dimensional vector representing unique facial features.
*   **Liveness Score:** A probability value (0.0 to 1.0) indicating the likelihood that the subject is a real human.
*   **Deepfake Probability:** A score indicating the likelihood that the input is synthetically generated.

## 3. Non-Functional Requirements
*   **Performance:** Liveness and deepfake checks must complete in under 2 seconds on modern devices (iPhone 12+, Pixel 6+).
*   **Security:** Use Trusted Execution Environment (TEE) or Secure Enclave where possible for cryptographic operations.
*   **Reliability:** Work in various lighting conditions (50 lux to 10000 lux).

---
id: US-02-FACE-002
title: Track Facial Landmarks
description: Implement the logic to accurately track facial landmarks from camera frames.
status: DONE
---

# User Story: Track Facial Landmarks

## 1. Acceptance Criteria

- The system must be able to process camera frames and accurately detect and track facial landmarks.
- The output should conform to the `IFaceDetection` interface defined in `specs/03-ARCHITECTURE.md`, including bounding boxes, landmark points (eyes, nose, mouth), and rotation angles.
- When no face is detected, the function should return `null`.

## 2. Technical Notes (Architect)

- **Native Plugin Update**: Modify `android/app/src/main/java/com/aureliussecureface/frameprocessors/FaceDetectorPlugin.kt`.
  - Update `FaceDetectorOptions` to `.setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)`.
  - Iterate over detected landmarks (LEFT_EYE, RIGHT_EYE, NOSE_BASE, MOUTH_LEFT, MOUTH_RIGHT, MOUTH_BOTTOM) and map them to the `landmarks` dictionary.
  - Ensure the coordinates are returned in the same coordinate system as the bounding box.
- **Unified Interface**: Ensure the bridge mapping matches the `IFaceDetection` interface exactly to avoid breaking `useFaceDetection.ts`.
- **Performance**: Monitor latency; landmark extraction is heavier than simple detection. Ensure we stay below the 200ms threshold.

## 3. Business Value

Accurate landmark tracking is fundamental for liveness detection and anti-deepfake analysis, ensuring the security and reliability of the AureliusSecureFace application.

## 4. Task Breakdown

- [x] Update Native `FaceDetectorPlugin.kt` to enable `LANDMARK_MODE_ALL`.
- [x] Implement landmark extraction and mapping in Kotlin.
- [x] Map MLKit output to `IFaceDetection` interface in the JS layer.
- [x] Write unit tests for the face processor (JS side).
- [x] Write unit tests for `useFaceDetection` hook.
- [x] Verified data flow via unit tests.

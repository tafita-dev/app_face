package com.aureliussecureface.frameprocessors

import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import kotlin.math.PI

class FaceDetectorPlugin(
    proxy: VisionCameraProxy,
    options: Map<String, Any>?
) : FrameProcessorPlugin() {

    private val detectorOptions = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
        .build()

    private val detector = FaceDetection.getClient(detectorOptions)

    override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
        val mediaImage: Image = frame.image

        // --- Conversion sécurisée de l'orientation ---
        val orientationDegrees = when (val o = frame.orientation) {
            is Number -> (o.toDouble() * 180.0 / PI).toInt()
            is String -> o.toDoubleOrNull()?.times(180.0 / PI)?.toInt() ?: 0
            else -> 0
        }

        val image = InputImage.fromMediaImage(mediaImage, orientationDegrees)

        // Traitement avec ML Kit
        val task = detector.process(image)
        val faces = Tasks.await(task)

        val result = mutableListOf<Map<String, Any>>()
        for (face in faces) {
            val map = mutableMapOf<String, Any>()

            // Bounding box
            val bounds = mapOf(
                "top" to face.boundingBox.top.toDouble(),
                "left" to face.boundingBox.left.toDouble(),
                "width" to face.boundingBox.width().toDouble(),
                "height" to face.boundingBox.height().toDouble()
            )
            map["bounds"] = bounds

            // Angles
            map["rollAngle"] = face.headEulerAngleZ.toDouble()
            map["pitchAngle"] = face.headEulerAngleX.toDouble()
            map["yawAngle"] = face.headEulerAngleY.toDouble()

            // Landmarks
            val landmarks = mutableMapOf<String, Map<String, Double>>()
            
            face.getLandmark(FaceLandmark.LEFT_EYE)?.let {
                landmarks["leftEye"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }
            face.getLandmark(FaceLandmark.RIGHT_EYE)?.let {
                landmarks["rightEye"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }
            face.getLandmark(FaceLandmark.NOSE_BASE)?.let {
                landmarks["noseBase"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }
            face.getLandmark(FaceLandmark.MOUTH_LEFT)?.let {
                landmarks["mouthLeft"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }
            face.getLandmark(FaceLandmark.MOUTH_RIGHT)?.let {
                landmarks["mouthRight"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }
            face.getLandmark(FaceLandmark.MOUTH_BOTTOM)?.let {
                landmarks["mouthBottom"] = mapOf("x" to it.position.x.toDouble(), "y" to it.position.y.toDouble())
            }

            map["landmarks"] = landmarks

            result.add(map)
        }

        return result
    }
}

package com.aureliussecureface.frameprocessors

import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
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
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
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

            // Landmarks (vide pour l'instant)
            map["landmarks"] = emptyMap<String, Any>()

            result.add(map)
        }

        return result
    }
}
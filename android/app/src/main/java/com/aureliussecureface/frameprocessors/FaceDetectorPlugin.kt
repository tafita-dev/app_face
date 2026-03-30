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
        .setContourMode(FaceDetectorOptions.CONTOUR_MODE_ALL)
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

            // Contours
            val contoursMap = mutableMapOf<String, List<Map<String, Double>>>()
            val contourTypes = intArrayOf(
                com.google.mlkit.vision.face.FaceContour.FACE,
                com.google.mlkit.vision.face.FaceContour.LEFT_EYE,
                com.google.mlkit.vision.face.FaceContour.RIGHT_EYE,
                com.google.mlkit.vision.face.FaceContour.LEFT_EYEBROW_TOP,
                com.google.mlkit.vision.face.FaceContour.LEFT_EYEBROW_BOTTOM,
                com.google.mlkit.vision.face.FaceContour.RIGHT_EYEBROW_TOP,
                com.google.mlkit.vision.face.FaceContour.RIGHT_EYEBROW_BOTTOM,
                com.google.mlkit.vision.face.FaceContour.NOSE_BRIDGE,
                com.google.mlkit.vision.face.FaceContour.NOSE_BOTTOM,
                com.google.mlkit.vision.face.FaceContour.LEFT_CHEEK,
                com.google.mlkit.vision.face.FaceContour.RIGHT_CHEEK,
                com.google.mlkit.vision.face.FaceContour.UPPER_LIP_TOP,
                com.google.mlkit.vision.face.FaceContour.UPPER_LIP_BOTTOM,
                com.google.mlkit.vision.face.FaceContour.LOWER_LIP_TOP,
                com.google.mlkit.vision.face.FaceContour.LOWER_LIP_BOTTOM
            )

            val contourNames = arrayOf(
                "FACE", "LEFT_EYE", "RIGHT_EYE", "LEFT_EYEBROW_TOP", "LEFT_EYEBROW_BOTTOM",
                "RIGHT_EYEBROW_TOP", "RIGHT_EYEBROW_BOTTOM", "NOSE_BRIDGE", "NOSE_BOTTOM",
                "LEFT_CHEEK", "RIGHT_CHEEK", "UPPER_LIP_TOP", "UPPER_LIP_BOTTOM",
                "LOWER_LIP_TOP", "LOWER_LIP_BOTTOM"
            )

            for (i in contourTypes.indices) {
                face.getContour(contourTypes[i])?.let { contour ->
                    contoursMap[contourNames[i]] = contour.points.map { point ->
                        mapOf("x" to point.x.toDouble(), "y" to point.y.toDouble())
                    }
                }
            }
            map["contours"] = contoursMap

            // --- Passive Texture Analysis (Emergency Fix) ---
            // Calculate pixel variance in the face region as a fallback for TFLite
            val variance = calculateLaplacianVariance(mediaImage, face.boundingBox)
            map["textureAnalysis"] = mapOf(
                "variance" to variance,
                "moireDetected" to false // To be replaced with TFLite Moire detector
            )

            result.add(map)
        }

        return result
    }

    private fun calculateLaplacianVariance(image: Image, bounds: android.graphics.Rect): Double {
        val plane = image.planes[0] // Use Y plane for variance calculation
        val buffer = plane.buffer
        val width = image.width
        val height = image.height
        val rowStride = plane.rowStride
        val pixelStride = plane.pixelStride

        // Clamp bounds to image dimensions
        val left = bounds.left.coerceIn(0, width - 1)
        val top = bounds.top.coerceIn(0, height - 1)
        val right = bounds.right.coerceIn(0, width - 1)
        val bottom = bounds.bottom.coerceIn(0, height - 1)

        if (right <= left || bottom <= top) return 0.0

        var sum = 0.0
        var sumSq = 0.0
        var count = 0

        // Simple Laplacian operator: [0, 1, 0; 1, -4, 1; 0, 1, 0]
        for (y in top + 1 until bottom - 1) {
            for (x in left + 1 until right - 1) {
                val center = buffer.get(y * rowStride + x * pixelStride).toInt() and 0xFF
                val leftPixel = buffer.get(y * rowStride + (x - 1) * pixelStride).toInt() and 0xFF
                val rightPixel = buffer.get(y * rowStride + (x + 1) * pixelStride).toInt() and 0xFF
                val topPixel = buffer.get((y - 1) * rowStride + x * pixelStride).toInt() and 0xFF
                val bottomPixel = buffer.get((y + 1) * rowStride + x * pixelStride).toInt() and 0xFF

                val laplacian = (leftPixel + rightPixel + topPixel + bottomPixel - 4 * center).toDouble()
                sum += laplacian
                sumSq += laplacian * laplacian
                count++
            }
        }

        if (count == 0) return 0.0
        val mean = sum / count
        return (sumSq / count) - (mean * mean)
    }
}

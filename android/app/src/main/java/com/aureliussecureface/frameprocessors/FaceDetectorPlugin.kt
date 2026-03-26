package com.aureliussecureface.frameprocessors

import android.media.Image
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy

class FaceDetectorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?): FrameProcessorPlugin() {
  private val detectorOptions = FaceDetectorOptions.Builder()
    .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
    .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
    .setContourMode(FaceDetectorOptions.CONTOUR_MODE_NONE)
    .build()
  private val detector = FaceDetection.getClient(detectorOptions)

  override fun callback(frame: Frame, params: Map<String, Any>?): Any? {
    val mediaImage: Image = frame.image
    val image = InputImage.fromMediaImage(mediaImage, frame.orientation.toDegrees())
    
    val task = detector.process(image)
    val faces = Tasks.await(task)

    val result = mutableListOf<Map<String, Any>>()
    for (face in faces) {
      val map = mutableMapOf<String, Any>()
      
      val bounds = mutableMapOf<String, Any>()
      bounds["top"] = face.boundingBox.top.toDouble()
      bounds["left"] = face.boundingBox.left.toDouble()
      bounds["width"] = face.boundingBox.width().toDouble()
      bounds["height"] = face.boundingBox.height().toDouble()
      map["bounds"] = bounds
      
      map["rollAngle"] = face.headEulerAngleZ.toDouble()
      map["pitchAngle"] = face.headEulerAngleX.toDouble()
      map["yawAngle"] = face.headEulerAngleY.toDouble()
      
      // Landmarks will be added in US-02-FACE-002
      map["landmarks"] = emptyMap<String, Any>()
      
      result.add(map)
    }
    
    return result
  }
}

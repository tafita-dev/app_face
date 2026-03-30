import VisionCamera
import MLKitFaceDetection
import MLKitVision

@objc(FaceDetectorPlugin)
public class FaceDetectorPlugin: FrameProcessorPlugin {
  private static let options: FaceDetectorOptions = {
    let options = FaceDetectorOptions()
    options.performanceMode = .accurate
    options.landmarkMode = .all
    options.contourMode = .all
    return options
  }()

  private let faceDetector = FaceDetector.faceDetector(options: FaceDetectorPlugin.options)

  @objc
  public init(proxy: VisionCameraProxy, options: [AnyHashable: Any]?) {
    super.init(proxy: proxy, options: options)
  }

  public override func callback(_ frame: Frame, withArguments arguments: [AnyHashable: Any]?) -> Any? {
    let image = VisionImage(buffer: frame.buffer)
    image.orientation = frame.orientation

    var faces: [Face]
    do {
      faces = try faceDetector.results(in: image)
    } catch {
      return nil
    }

    var result: [[String: Any]] = []
    for face in faces {
      var map: [String: Any] = [:]

      // Bounding box
      map["bounds"] = [
        "top": face.frame.origin.y,
        "left": face.frame.origin.x,
        "width": face.frame.size.width,
        "height": face.frame.size.height
      ]

      // Angles
      map["rollAngle"] = face.headEulerAngleZ
      map["pitchAngle"] = face.headEulerAngleX
      map["yawAngle"] = face.headEulerAngleY

      // Landmarks
      var landmarks: [String: [String: CGFloat]] = [:]
      let landmarkTypes: [(String, FaceLandmarkType)] = [
        ("leftEye", .leftEye),
        ("rightEye", .rightEye),
        ("noseBase", .noseBase),
        ("mouthLeft", .leftMouth),
        ("mouthRight", .rightMouth),
        ("mouthBottom", .mouthBottom)
      ]

      for (name, type) in landmarkTypes {
        if let landmark = face.landmark(ofType: type) {
          landmarks[name] = ["x": landmark.position.x, "y": landmark.position.y]
        }
      }
      map["landmarks"] = landmarks

      // Contours
      var contoursMap: [String: [[String: CGFloat]]] = [:]
      let contourTypes: [(String, FaceContourType)] = [
        ("FACE", .face),
        ("LEFT_EYE", .leftEye),
        ("RIGHT_EYE", .rightEye),
        ("LEFT_EYEBROW_TOP", .leftEyebrowTop),
        ("LEFT_EYEBROW_BOTTOM", .leftEyebrowBottom),
        ("RIGHT_EYEBROW_TOP", .rightEyebrowTop),
        ("RIGHT_EYEBROW_BOTTOM", .rightEyebrowBottom),
        ("NOSE_BRIDGE", .noseBridge),
        ("NOSE_BOTTOM", .noseBottom),
        ("LEFT_CHEEK", .leftCheek),
        ("RIGHT_CHEEK", .rightCheek),
        ("UPPER_LIP_TOP", .upperLipTop),
        ("UPPER_LIP_BOTTOM", .upperLipBottom),
        ("LOWER_LIP_TOP", .lowerLipTop),
        ("LOWER_LIP_BOTTOM", .lowerLipBottom)
      ]

      for (name, type) in contourTypes {
        if let contour = face.contour(ofType: type) {
          contoursMap[name] = contour.points.map { ["x": $0.x, "y": $0.y] }
        }
      }
      map["contours"] = contoursMap

      // --- Passive Texture Analysis ---
      let variance = calculateLaplacianVariance(frame.buffer, bounds: face.frame)
      map["textureAnalysis"] = [
        "variance": variance,
        "moireDetected": false // Placeholder
      ]

      result.append(map)
    }

    return result
  }

  private func calculateLaplacianVariance(_ buffer: CMSampleBuffer, bounds: CGRect) -> Double {
    guard let imageBuffer = CMSampleBufferGetImageBuffer(buffer) else { return 0.0 }
    CVPixelBufferLockBaseAddress(imageBuffer, .readOnly)
    defer { CVPixelBufferUnlockBaseAddress(imageBuffer, .readOnly) }

    guard let baseAddress = CVPixelBufferGetBaseAddressOfPlane(imageBuffer, 0) else { return 0.0 }
    let width = CVPixelBufferGetWidth(imageBuffer)
    let height = CVPixelBufferGetHeight(imageBuffer)
    let bytesPerRow = CVPixelBufferGetBytesPerRowOfPlane(imageBuffer, 0)

    let left = Int(max(0, min(CGFloat(width - 1), bounds.origin.x)))
    let top = Int(max(0, min(CGFloat(height - 1), bounds.origin.y)))
    let right = Int(max(0, min(CGFloat(width - 1), bounds.origin.x + bounds.size.width)))
    let bottom = Int(max(0, min(CGFloat(height - 1), bounds.origin.y + bounds.size.height)))

    if right <= left || bottom <= top { return 0.0 }

    var sum: Double = 0.0
    var sumSq: Double = 0.0
    var count = 0

    let data = baseAddress.assumingMemoryBound(to: UInt8.self)

    for y in (top + 1)..<(bottom - 1) {
      for x in (left + 1)..<(right - 1) {
        let center = Double(data[y * bytesPerRow + x])
        let leftPixel = Double(data[y * bytesPerRow + (x - 1)])
        let rightPixel = Double(data[y * bytesPerRow + (x + 1)])
        let topPixel = Double(data[(y - 1) * bytesPerRow + x])
        let bottomPixel = Double(data[(y + 1) * bytesPerRow + x])

        let laplacian = leftPixel + rightPixel + topPixel + bottomPixel - 4 * center
        sum += laplacian
        sumSq += laplacian * laplacian
        count += 1
      }
    }

    if count == 0 { return 0.0 }
    let mean = sum / Double(count)
    return (sumSq / Double(count)) - (mean * mean)
  }
}

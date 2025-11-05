import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

export async function createFaceDetector() {
  // Carga los binarios WASM de Tasks Vision
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  // Usa el modelo oficial hospedado por Google (evita 404)
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_detector/face_detection_short_range/float16/1/face_detection_short_range.tflite"
    },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5
  });

  return detector;
}

export function detectFace(detector, video, ts) {
  const res = detector.detectForVideo(video, ts);
  if (!res || !res.detections || res.detections.length === 0) return null;
  const d = res.detections[0];
  return d.boundingBox; // {originX, originY, width, height} en px
}

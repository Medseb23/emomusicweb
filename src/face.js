import { FaceDetector, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

export async function createFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  const detector = await FaceDetector.createFromOptions(vision, {
    baseOptions: { modelAssetPath: "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm/face_detector/face_detection_short_range.tflite" },
    runningMode: "VIDEO",
    minDetectionConfidence: 0.5,
  });
  return detector;
}

export function detectFace(detector, video, ts) {
  const res = detector.detectForVideo(video, ts);
  if (!res || !res.detections || res.detections.length === 0) return null;
  const d = res.detections[0];
  const box = d.boundingBox;
  return box;
}
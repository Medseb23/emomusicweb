// src/face.js
import {
  FaceDetector,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

/**
 * Cargamos WASM desde jsDelivr, pero el *modelo* .tflite lo servimos local:
 * assets/face_detection_short_range.tflite
 * (esto evita 404 y CORS en Codespaces/Pages)
 */
export async function createFaceDetector() {
  // Binarios WASM
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  // Ruta local al modelo (lo acabas de descargar)
  const localModel = "assets/face_detection_short_range.tflite";

  // Opción de respaldo (por si accedes directo sin el archivo en el repo)
  const remoteFallback =
    "https://storage.googleapis.com/mediapipe-models/face_detector/face_detection_short_range/float16/1/face_detection_short_range.tflite";

  // Intento con el modelo local primero
  try {
    return await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: localModel },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5
    });
  } catch (e) {
    console.warn("[FaceDetector] local model failed, trying remote…", e);
    // Fallback remoto
    return await FaceDetector.createFromOptions(vision, {
      baseOptions: { modelAssetPath: remoteFallback },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.5
    });
  }
}

export function detectFace(detector, video, ts) {
  const res = detector.detectForVideo(video, ts);
  if (!res || !res.detections || res.detections.length === 0) return null;
  const d = res.detections[0];
  return d.boundingBox; // {originX, originY, width, height} en píxeles
}

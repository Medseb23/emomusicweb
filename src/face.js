// src/face.js
import {
  FaceLandmarker,
  FilesetResolver
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

/**
 * MediaPipe Tasks Web usa archivos .task (no .tflite sueltos).
 * Guardamos el modelo en: assets/face_landmarker.task
 */
export async function createFaceDetector() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );

  const localTask = "assets/face_landmarker.task";
  const remoteFallback =
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

  try {
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: localTask },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false
    });
  } catch (e) {
    console.warn("[FaceLandmarker] local .task failed, trying remote…", e);
    return await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: remoteFallback },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false
    });
  }
}

export function detectFace(detector, video, ts) {
  const res = detector.detectForVideo(video, ts);
  if (!res || !res.faceLandmarks || res.faceLandmarks.length === 0) return null;

  // Bounding box a partir de landmarks (con 10% de margen)
  const pts = res.faceLandmarks[0];
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  for (const p of pts) { if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y; if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y; }
  const pad = 0.10;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(1, maxX + pad); maxY = Math.min(1, maxY + pad);

  const w = video.videoWidth, h = video.videoHeight;
  return {
    originX: Math.round(minX * w),
    originY: Math.round(minY * h),
    width  : Math.round((maxX - minX) * w),
    height : Math.round((maxY - minY) * h)
  };
}

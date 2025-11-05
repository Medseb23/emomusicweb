import { createFaceDetector, detectFace } from "./face.js";
import { createOrtSession, preprocessToFER, inferFER } from "./emotion.js";
import { AudioEngine } from "./audio/engine.js";

const ui = {
  startBtn: document.getElementById("startBtn"),
  status: document.getElementById("status"),
  video: document.getElementById("video"),
  debug: document.getElementById("debug"),
  emotion: document.getElementById("emotion"),
  state: document.getElementById("state"),
  conf: document.getElementById("confidence"),
};

const simpleMap = {
  neutral: "neutral", happiness: "happy", sadness: "sad", anger: "angry",
  disgust: "disgust", fear: "fear", surprise: "surprise", contempt: "angry",
};

let detector, session, audio;
let hist = [];
const SMOOTH = 3;
const CONF_THR = 0.60;

ui.startBtn.onclick = async () => {
  try {
    ui.startBtn.disabled = true;
    ui.status.textContent = "Pidiendo permisos de cámara…";

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: 640, height: 480 },
      audio: false
    });
    ui.video.srcObject = stream;
    await ui.video.play();

    ui.status.textContent = "Inicializando audio…";
    audio = new AudioEngine();
    await audio.start();

    ui.status.textContent = "Cargando detector de rostro…";
    detector = await createFaceDetector();

    ui.status.textContent = "Cargando modelo de emociones…";
    session = await createOrtSession((msg) => (ui.status.textContent = msg));

    ui.status.textContent = "Listo. Detectando…";
    runLoop();
  } catch (e) {
    console.error(e);
    ui.status.textContent = "Error: " + (e?.message || e);
    ui.startBtn.disabled = false;
  }
};

function runLoop() {
  const dbg = ui.debug.getContext("2d");
  const faceCanvas = new OffscreenCanvas(128, 128);

  const tick = async () => {
    const ts = performance.now();
    dbg.drawImage(ui.video, 0, 0, ui.debug.width, ui.debug.height);

    const box = detectFace(detector, ui.video, ts);
    if (box) {
      dbg.strokeStyle = "#4cffb5";
      dbg.lineWidth = 2;
      dbg.strokeRect(box.originX, box.originY, box.width, box.height);

      // recorte a resolución del <video> real
      const scaleX = ui.video.videoWidth / ui.debug.width;
      const scaleY = ui.video.videoHeight / ui.debug.height;
      const fx = Math.max(0, Math.floor(box.originX * scaleX));
      const fy = Math.max(0, Math.floor(box.originY * scaleY));
      const fw = Math.max(1, Math.floor(box.width * scaleX));
      const fh = Math.max(1, Math.floor(box.height * scaleY));

      const fc = faceCanvas.getContext("2d");
      fc.drawImage(ui.video, fx, fy, fw, fh, 0, 0, faceCanvas.width, faceCanvas.height);

      // FER+
      try {
        const input = preprocessToFER(faceCanvas);
        const { label, confidence } = await inferFER(session, input);

        // suavizado corto
        hist.push({ label, confidence });
        if (hist.length > SMOOTH) hist.shift();
        const avg = avgLabel(hist);
        const conf = avg.conf;

        ui.emotion.textContent = avg.label;
        ui.conf.textContent = conf.toFixed(2);

        if (conf >= CONF_THR) {
          const simple = simpleMap[avg.label] || "neutral";
          ui.state.textContent = simple;
          audio.setState(simple); // stinger + loop
        }
      } catch (e) {
        console.warn("Inferencia falló:", e);
      }
    }

    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function avgLabel(items) {
  const acc = Object.create(null);
  for (const it of items) acc[it.label] = (acc[it.label] || 0) + it.confidence;
  let best = "neutral", bestv = -1;
  for (const k in acc) if (acc[k] > bestv) { best = k; bestv = acc[k]; }
  return { label: best, conf: Math.min(1, bestv / items.length) };
}

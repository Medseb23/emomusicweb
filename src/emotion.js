import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.min.js";

export const FER_CLASSES = ["neutral","happiness","surprise","sadness","anger","disgust","fear","contempt"];

// Orden estable para Codespaces/Pages (evita cuelgue de WebGPU)
const EP_ORDER = ["webgl", "wasm"];

export async function createOrtSession(onStatus) {
  const url = "assets/emotion-ferplus-8.onnx";
  let lastErr;
  for (const ep of EP_ORDER) {
    try {
      onStatus?.(`Cargando modelo (EP=${ep})…`);
      const session = await ort.InferenceSession.create(url, { executionProviders: [ep] });
      console.log("[ORT] usando", ep);
      onStatus?.(`Modelo cargado (EP=${ep})`);
      return session;
    } catch (e) {
      console.warn("[ORT]", ep, "falló:", e);
      lastErr = e;
    }
  }
  throw lastErr || new Error("No se pudo inicializar ORT Web");
}

export function preprocessToFER(faceCanvas) {
  const W = 64, H = 64;
  const tmp = new OffscreenCanvas(W, H);
  const tctx = tmp.getContext("2d");
  tctx.drawImage(faceCanvas, 0, 0, W, H);
  const data = tctx.getImageData(0, 0, W, H).data;

  // Gris (luma) a float32
  const out = new Float32Array(1 * 1 * H * W);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    out[j] = 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return out;
}

export async function inferFER(session, inputGray64) {
  const input = new ort.Tensor("float32", inputGray64, [1, 1, 64, 64]);
  const res = await session.run({ [session.inputNames[0]]: input });
  const logits = res[session.outputNames[0]].data;

  // softmax
  let max = -1e9;
  for (let i = 0; i < logits.length; i++) if (logits[i] > max) max = logits[i];
  let sum = 0;
  const exps = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) { exps[i] = Math.exp(logits[i] - max); sum += exps[i]; }
  for (let i = 0; i < exps.length; i++) exps[i] /= sum;

  let im = 0;
  for (let i = 1; i < exps.length; i++) if (exps[i] > exps[im]) im = i;
  return { index: im, label: FER_CLASSES[im], confidence: exps[im], probs: exps };
}

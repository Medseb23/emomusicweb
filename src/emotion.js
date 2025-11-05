import * as ort from "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.0/dist/ort.min.js";

export const FER_CLASSES = ["neutral","happiness","surprise","sadness","anger","disgust","fear","contempt"];

export async function createOrtSession() {
  const prefer = ['webgpu','webgl','wasm'];
  let session;
  for (const ep of prefer) {
    try {
      session = await ort.InferenceSession.create('assets/emotion-ferplus-8.onnx', { executionProviders: [ep] });
      console.log('[ORT] usando', ep);
      return session;
    } catch (e) {
      console.warn('[ORT] EP', ep, 'falló, probando siguiente...', e);
    }
  }
  throw new Error('No se pudo inicializar ORT Web.');
}

export function preprocessToFER(faceCanvas) {
  const ctx = faceCanvas.getContext('2d', { willReadFrequently: true });
  const img = ctx.getImageData(0, 0, faceCanvas.width, faceCanvas.height);
  const W = 64, H = 64;
  const tmp = new OffscreenCanvas(W, H);
  const tctx = tmp.getContext('2d');
  tctx.drawImage(faceCanvas, 0, 0, W, H);
  const data = tctx.getImageData(0,0,W,H).data;

  const out = new Float32Array(1 * 1 * H * W);
  for (let i=0, j=0; i<data.length; i+=4, j++) {
    const r = data[i], g = data[i+1], b = data[i+2];
    out[j] = (0.299*r + 0.587*g + 0.114*b);
  }
  return out;
}

export async function inferFER(session, inputGray64) {
  const tensor = new ort.Tensor('float32', inputGray64, [1,1,64,64]);
  const res = await session.run({ [session.inputNames[0]]: tensor });
  const logits = res[session.outputNames[0]];
  const arr = logits.data;
  let max = -1e9; for (let i=0;i<arr.length;i++) if (arr[i]>max) max=arr[i];
  let sum=0; const exps = new Float32Array(arr.length);
  for (let i=0;i<arr.length;i++){ exps[i]=Math.exp(arr[i]-max); sum+=exps[i]; }
  for (let i=0;i<exps.length;i++) exps[i]/=sum;
  let im=0; for (let i=1;i<exps.length;i++) if (exps[i]>exps[im]) im=i;
  return { index: im, label: FER_CLASSES[im], confidence: exps[im], probs: exps };
}
# Emo Music Web (client-only, GitHub Pages ready)

Convierte expresiones faciales en música **en tu navegador** (100% local):
- Cámara: `getUserMedia`
- Rostro: MediaPipe Tasks Web (FaceDetector)
- Emociones: ONNX Runtime Web (FER+, 8 clases)
- Audio: Web Audio + **AudioWorklet** (stinger inmediato + loops por emoción)

## Requisitos
- Servido bajo **HTTPS** (GitHub Pages funciona perfecto).
- Navegador moderno (Chrome/Edge recomendados).

## Archivos clave
- `index.html`: UI + boot.
- `src/main.js`: orquesta cámara, rostro, modelo y audio.
- `src/face.js`: inicializa MediaPipe FaceDetector.
- `src/emotion.js`: normaliza FER+ (64×64 gris) y corre ORT Web.
- `src/audio/engine.js`: controla AudioContext y el Worklet.
- `src/audio/looper-worklet.js`: sintetizador con patrones por emoción.
- `assets/emotion-ferplus-8.onnx`: **coloca aquí** el modelo FER+ (ONNX).

## Cómo agregar el modelo
Descarga **emotion-ferplus-8.onnx** (FER+ opset 8) y ponlo en `assets/` renombrado tal cual:
- Ruta esperada: `assets/emotion-ferplus-8.onnx`

## Levantar localmente
Abre este folder con un servidor estático (VSCode Live Server o):
```bash
python -m http.server 8000
```
Luego ve a http://localhost:8000

## Publicar en GitHub Pages
1. Crea un repo (por ejemplo `emo-music-web`) y sube todo este contenido.
2. En GitHub: **Settings » Pages** → Source: **Deploy from branch**, Branch: `main` `/ (root)`.
3. Abre la URL de Pages (https://<tuusuario>.github.io/emo-music-web/).
4. Acepta permisos de cámara y haz clic en **Iniciar** para habilitar audio.

## Notas
- Este demo usa **únicamente** recursos del cliente. No sube frames.
- Si tu navegador soporta **WebGPU**, ORT Web puede usarlo automáticamente; si no, usa WebGL/CPU.
- Si notas latencia en móvil, prueba en desktop. Para productos “serios” en móvil, prefiere apps nativas.
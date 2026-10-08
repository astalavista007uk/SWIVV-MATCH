// ponytail: on-device face match (no backend, photos never leave the browser) — server-side check + liveness if spoofing ever matters
// ponytail: dynamic import so SSR never loads tfjs-node (static import crashed /verification server render)
type FaceApi = typeof import("@vladmandic/face-api");
let api: FaceApi | null = null;

async function face(): Promise<FaceApi> {
  if (!api) api = await import("@vladmandic/face-api");
  return api;
}

let loaded = false;

export async function loadFaceModels(): Promise<void> {
  if (loaded) return;
  const faceapi = await face();
  const base = `${import.meta.env.BASE_URL}models`;
  await faceapi.nets.tinyFaceDetector.loadFromUri(base);
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri(base);
  await faceapi.nets.faceRecognitionNet.loadFromUri(base);
  loaded = true;
}

function imgOf(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/** Face descriptor, or null when no face is found. */
export async function faceDescriptor(src: string): Promise<Float32Array | null> {
  await loadFaceModels();
  const faceapi = await face();
  const det = await faceapi
    .detectSingleFace(await imgOf(src), new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return det?.descriptor ?? null;
}

/** Same person when < 0.6 (standard face-api threshold). */
export function isSamePerson(a: Float32Array, b: Float32Array): boolean {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    s += d * d;
  }
  return Math.sqrt(s) < 0.6;
}

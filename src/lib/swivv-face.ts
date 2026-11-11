// ponytail: on-device face match (no backend, photos never leave the browser) — server-side check + liveness if spoofing ever matters
// ponytail: dynamic import so SSR never loads tfjs-node (static import crashed /verification server render)
type FaceApi = typeof import("@vladmandic/face-api");
let api: FaceApi | null = null;

async function face(): Promise<FaceApi> {
  if (!api) api = await import("@vladmandic/face-api");
  return api;
}

// ponytail: cache the in-flight promise, not a boolean — two checks fired together
// (photo + ID) both saw loaded=false and re-fetched 6 MB of weights on the main thread
let loading: Promise<void> | null = null;

export function loadFaceModels(): Promise<void> {
  if (!loading) {
    loading = (async () => {
      const faceapi = await face();
      const base = `${import.meta.env.BASE_URL}models`;
      await faceapi.nets.tinyFaceDetector.loadFromUri(base);
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri(base);
      await faceapi.nets.faceRecognitionNet.loadFromUri(base);
    })().catch((e) => {
      loading = null;
      throw e;
    });
  }
  return loading;
}

function imgOf(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image"));
    img.src = src;
  });
}

/**
 * Remote photos are fetched into a blob URL first: a cross-origin <img> without CORS
 * taints the WebGL canvas and face-api's texture upload throws mid-promise, leaving the
 * button spinning forever. Blob URLs are same-origin and cannot taint.
 * ponytail: needs the host to send CORS (Supabase Storage and Unsplash do) — proxy the
 * photo server-side if a storage host ever stops allowing it.
 */
async function sameOrigin(src: string): Promise<{ url: string; revoke: boolean }> {
  if (!/^https?:/i.test(src)) return { url: src, revoke: false };
  const res = await fetch(src, { mode: "cors" });
  if (!res.ok) throw new Error("image");
  return { url: URL.createObjectURL(await res.blob()), revoke: true };
}

/** Face descriptor, or null when no face is found. */
export async function faceDescriptor(src: string): Promise<Float32Array | null> {
  await loadFaceModels();
  const faceapi = await face();
  const { url, revoke } = await sameOrigin(src);
  try {
    const det = await faceapi
      .detectSingleFace(await imgOf(url), new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    return det?.descriptor ?? null;
  } finally {
    if (revoke) URL.revokeObjectURL(url);
  }
}

/** Euclidean descriptor distance (face-api convention: lower is closer). */
export function faceDistance(a: Float32Array, b: Float32Array): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    s += d * d;
  }
  return Math.sqrt(s);
}

/** Same person when < 0.6 (standard face-api threshold). */
export function isSamePerson(a: Float32Array, b: Float32Array): boolean {
  return faceDistance(a, b) < 0.6;
}

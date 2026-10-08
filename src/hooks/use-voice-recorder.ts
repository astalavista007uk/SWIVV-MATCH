import { useCallback, useEffect, useRef, useState } from "react";

// ponytail: native MediaRecorder, default mimeType — explicit mimeType pick if Safari ever rejects the blob
export function useVoiceRecorder() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const doneRef = useRef<((blob: Blob | null) => void) | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async (): Promise<string | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      streamRef.current = stream;
      recRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || "audio/webm";
        doneRef.current?.(
          chunksRef.current.length > 0 ? new Blob(chunksRef.current, { type }) : null,
        );
        doneRef.current = null;
        cleanup();
      };
      rec.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
      return null;
    } catch {
      return "Micro inaccessible — vérifie l'autorisation du navigateur.";
    }
  }, [cleanup]);

  const stop = useCallback((): Promise<Blob | null> => {
    const rec = recRef.current;
    if (!rec || rec.state === "inactive") {
      cleanup();
      setRecording(false);
      return Promise.resolve(null);
    }
    setRecording(false);
    return new Promise((resolve) => {
      doneRef.current = resolve;
      rec.stop();
    });
  }, [cleanup]);

  const cancel = useCallback(() => {
    doneRef.current?.(null);
    doneRef.current = null;
    setRecording(false);
    setSeconds(0);
    try {
      recRef.current?.state !== "inactive" && recRef.current?.stop();
    } catch {}
    cleanup();
  }, [cleanup]);

  return { recording, seconds, start, stop, cancel };
}

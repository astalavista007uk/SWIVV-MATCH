import { useRef, useState } from "react";
import { Download, MoreVertical, Pause, Play } from "lucide-react";
import { SwivvHint } from "@/components/swivv-hint";

// ponytail: custom player only because native <audio> chrome (⋮ menu, tooltips) is unreachable by CSS — if browsers ever allow styling it, delete this and go native
const RATES = [1, 1.5, 2, 0.5];

function fmt(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function SwivvVoicePlayer({ src, dark = false }: { src: string | undefined; dark?: boolean }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [len, setLen] = useState(0);
  const [rate, setRate] = useState(0);
  const [menu, setMenu] = useState(false);
  const [err, setErr] = useState(false);
  const fg = dark ? "text-white" : "text-[#333]";
  const sub = dark ? "text-white/70" : "text-[#999]";
  if (!src) return null;

  return (
    <span className={`flex min-w-0 flex-1 items-center gap-1.5 ${fg}`}>
      <audio
        ref={audio}
        preload="metadata"
        src={src}
        onLoadedMetadata={(e) => setLen(e.currentTarget.duration)}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onEnded={() => setPlaying(false)}
        onError={() => setErr(true)}
      />
      <button
        type="button"
        aria-label={playing ? "Pause" : "Lecture"}
        onClick={() => {
          const a = audio.current;
          if (!a) return;
          if (playing) { a.pause(); setPlaying(false); } else { void a.play(); setPlaying(true); }
        }}
        className="shrink-0 rounded-full p-1.5 hover:bg-black/10"
      >
        {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </button>
      <span className={`shrink-0 text-[11px] tabular-nums ${sub}`}>{fmt(pos)}</span>
      <input
        type="range"
        min={0}
        max={len || 0}
        step={0.1}
        value={Math.min(pos, len || 0)}
        onChange={(e) => {
          const a = audio.current;
          if (!a) return;
          a.currentTime = Number(e.target.value);
          setPos(a.currentTime);
        }}
        aria-label="Position de lecture"
        className={`h-1 min-w-0 flex-1 cursor-pointer ${dark ? "accent-white" : "accent-[#e91e63]"}`}
      />
      <span className={`shrink-0 text-[11px] tabular-nums ${sub}`}>{fmt(len)}</span>
      <span className="relative shrink-0">
        <SwivvHint narrow text="Plus d'options">
          <button
            type="button"
            aria-label="Plus d'options"
            aria-expanded={menu}
            onClick={() => setMenu((v) => !v)}
            className="rounded p-1 hover:bg-black/10"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </SwivvHint>
        {menu && (
          <>
            <button type="button" aria-label="Fermer le menu" onClick={() => setMenu(false)} className="fixed inset-0 z-10 cursor-default" />
            <span className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-lg bg-black text-white shadow-lg">
              <button
                type="button"
                onClick={async () => {
                  setMenu(false);
                  try {
                    const b = await (await fetch(src)).blob();
                    const aEl = document.createElement("a");
                    aEl.href = URL.createObjectURL(b);
                    aEl.download = `swivv-vocal-${Date.now()}.mp4`;
                    aEl.click();
                    window.setTimeout(() => URL.revokeObjectURL(aEl.href), 5000);
                  } catch {
                    window.open(src, "_blank");
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-white/10"
              >
                <Download className="h-3.5 w-3.5" /> Télécharger
              </button>
              <button
                type="button"
                onClick={() => {
                  const n = (rate + 1) % RATES.length;
                  setRate(n);
                  if (audio.current) audio.current.playbackRate = RATES[n]!;
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] hover:bg-white/10"
              >
                Vitesse : {RATES[rate]}×
              </button>
            </span>
          </>
        )}
      </span>
      {err && <span className="text-xs text-red-600">Lecture impossible — vérifie ta connexion.</span>}
    </span>
  );
}

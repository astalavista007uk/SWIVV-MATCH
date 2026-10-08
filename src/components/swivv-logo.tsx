import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SRC = "/swivv-match-logo.jpg";

// ponytail: canvas recolor instead of new assets (white box → transparent; dark also whitens SWIVV) — ship real transparent PNGs when brand assets allow
const pixelCache: Partial<Record<"dark" | "plain", string>> = {};

function usePixelLogo(mode: "dark" | "plain" | null) {
  const [src, setSrc] = useState<string | null>(mode ? (pixelCache[mode] ?? null) : null);
  useEffect(() => {
    if (!mode || pixelCache[mode]) return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement("canvas");
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height);
      const px = d.data;
      for (let i = 0; i < px.length; i += 4) {
        const mx = Math.max(px[i], px[i + 1], px[i + 2]);
        const mn = Math.min(px[i], px[i + 1], px[i + 2]);
        if (mn > 200) px[i + 3] = 0;
        else if (mode === "dark" && mx - mn < 48) px[i] = px[i + 1] = px[i + 2] = 255;
      }
      ctx.putImageData(d, 0, 0);
      pixelCache[mode] = cv.toDataURL("image/png");
      if (live) setSrc(pixelCache[mode]!);
    };
    img.src = SRC;
    return () => {
      live = false;
    };
  }, [mode]);
  return src;
}

// ponytail: static image, no SVG rebuild — re-vectorize if crisp scaling past ~200px is needed
export function SwivvLogo({ className, dark }: { className?: string; dark?: boolean }) {
  const processed = usePixelLogo(dark ? "dark" : "plain");
  if (dark && !processed) return <span aria-hidden className={cn("inline-block h-8 w-28", className)} />;
  return (
    <img
      src={processed ?? SRC}
      alt="SWIVV Match"
      className={cn("h-[4.5rem] w-auto max-w-[52vw] shrink-0 -ml-4 -mt-4 object-contain sm:ml-0 sm:mt-0 sm:h-20 sm:max-w-none sm:-my-3", className)}
    />
  );
}

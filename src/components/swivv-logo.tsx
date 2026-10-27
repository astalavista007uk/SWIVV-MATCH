import { cn } from "@/lib/utils";

// ponytail: two flattened PNGs (navy marks on light, white SWIVV + pink MATCH on dark) recoloured once by script — a true two-tone SVG if the brand ships one
export function SwivvLogo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <img
      src={dark ? "/swivv-match-logo-inverse.png" : "/swivv-match-logo-transparent.png"}
      alt="SWIVV Match"
      className={cn("h-[4.5rem] w-auto max-w-[52vw] shrink-0 -ml-4 -mt-4 object-contain sm:ml-0 sm:mt-0 sm:h-20 sm:max-w-none sm:-my-3", className)}
    />
  );
}

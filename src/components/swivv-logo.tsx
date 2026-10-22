import { cn } from "@/lib/utils";

// ponytail: transparent PNG straight in — no canvas recolor, no blend hacks, no flash; dark headers get a mono-white CSS invert (pink heart goes white there too — true two-tone SVG if the admin header ever needs the pink back)
export function SwivvLogo({ className, dark }: { className?: string; dark?: boolean }) {
  return (
    <img
      src="/swivv-match-logo-transparent.png"
      alt="SWIVV Match"
      className={cn("h-[4.5rem] w-auto max-w-[52vw] shrink-0 -ml-4 -mt-4 object-contain sm:ml-0 sm:mt-0 sm:h-20 sm:max-w-none sm:-my-3", dark && "brightness-0 invert", className)}
    />
  );
}

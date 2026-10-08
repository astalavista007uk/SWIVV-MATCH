import { Images } from "lucide-react";

/** Photo count chip, bottom-left over a profile photo — always shown, even for a single photo. */
export function PhotoCountBadge({ n }: { n: number }) {
  return (
    <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
      <Images className="h-3 w-3" aria-hidden="true" />
      {n}
    </span>
  );
}

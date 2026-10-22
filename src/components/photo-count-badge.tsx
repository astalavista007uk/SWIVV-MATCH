import { Images } from "lucide-react";

/** Photo count chip, bottom-left over a profile photo — hidden for 0/1 photo (the lean feed only ships the primary photo, so a "1" would misrepresent members with more). */
export function PhotoCountBadge({ n, className }: { n: number; className?: string }) {
  if (n <= 1) return null;
  return (
    <span className={`absolute bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white ${className || "left-2"}`}>
      <Images className="h-3 w-3" aria-hidden="true" />
      {n}
    </span>
  );
}

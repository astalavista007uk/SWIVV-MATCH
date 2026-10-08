import { useEffect, useState, useRef } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFavoritesContext } from "@/lib/favorites-context";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function HeartButton({
  targetId,
  kind,
  showCount = true,
  className,
  size = "sm",
}: {
  targetId: string;
  kind: "service" | "pet";
  showCount?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { user } = useAuth();
  const { isFavorited, toggle } = useFavoritesContext();
  const [likeCount, setLikeCount] = useState(0);
  const togglingRef = useRef(false);
  const liked = isFavorited(targetId, kind);

  useEffect(() => {
    supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("target_id", targetId)
      .eq("kind", kind)
      .then(({ count, error }) => {
        if (error) {
          console.error("Failed to fetch like count:", error);
        }
        setLikeCount(count ?? 0);
      });
  }, [targetId, kind, liked]);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (togglingRef.current) return;
    togglingRef.current = true;
    try {
      const success = await toggle(targetId, kind);
      if (!success) {
        toast.error("Failed to save. Check console for details.");
      }
    } finally {
      togglingRef.current = false;
    }
  }

  const sizeClass = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn("inline-flex items-center gap-1 rounded-full p-1 transition-colors hover:bg-black/10", className)}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        className={cn(
          sizeClass,
          "transition-colors",
          liked ? "fill-primary text-primary" : "text-white",
        )}
        aria-hidden="true"
      />
      {showCount && likeCount > 0 && (
        <span className="text-xs font-semibold text-white drop-shadow-sm">{likeCount}</span>
      )}
    </button>
  );
}

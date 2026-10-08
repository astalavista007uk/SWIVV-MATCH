import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";

export type LocationSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  city: string;
  country: string;
};

type Props = {
  value: string;
  onChange: (val: string) => void;
  onSelect?: (suggestion: LocationSuggestion) => void;
  placeholder?: string;
  className?: string;
  id?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const APP_UA = "PETBASE/1.0";
const CACHE_TTL = 10 * 60 * 1000;

const queryCache = new Map<string, { data: LocationSuggestion[]; ts: number }>();

function extractCity(addr: any): string {
  return addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county || "";
}

function parseResults(json: any[]): LocationSuggestion[] {
  return json.map((item) => ({
    display_name: item.display_name,
    lat: item.lat,
    lon: item.lon,
    city: extractCity(item.address),
    country: item.address?.country || "",
  }));
}

async function fetchSuggestions(query: string): Promise<LocationSuggestion[]> {
  const cached = queryCache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }
  const url = `${NOMINATIM_URL}?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "User-Agent": APP_UA } });
  if (!res.ok) return [];
  const json = await res.json();
  const results = parseResults(json);
  queryCache.set(query, { data: results, ts: Date.now() });
  return results;
}

export function LocationAutocomplete({ value, onChange, onSelect, placeholder, className, id }: Props) {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const lastRequestRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const reposition = useCallback(() => {
    if (!open || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      left: rect.left,
      top: rect.bottom + 4,
      width: rect.width,
      zIndex: 9999,
    });
  }, [open]);

  const debouncedSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const now = Date.now();
      const elapsed = now - lastRequestRef.current;
      if (elapsed < 1100) {
        await new Promise((r) => setTimeout(r, 1100 - elapsed));
      }
      lastRequestRef.current = Date.now();
      const results = await fetchSuggestions(q.trim());
      setSuggestions(results);
      setOpen(results.length > 0);
      setHighlightedIdx(-1);
    }, 350);
  }, []);

  useEffect(() => {
    reposition();
  }, [open, suggestions, reposition]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        inputRef.current && !inputRef.current.contains(target) &&
        menuRef.current && !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleScrollResize() {
      reposition();
    }
    window.addEventListener("scroll", handleScrollResize, true);
    window.addEventListener("resize", handleScrollResize);
    return () => {
      window.removeEventListener("scroll", handleScrollResize, true);
      window.removeEventListener("resize", handleScrollResize);
    };
  }, [open, reposition]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    debouncedSearch(val);
  }

  function handleSelect(item: LocationSuggestion) {
    const short = item.city || item.display_name.split(",")[0].trim();
    onChange(short);
    if (onSelect) onSelect(item);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && highlightedIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[highlightedIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const dropdown = open && suggestions.length > 0 ? (
    <ul
      ref={menuRef}
      style={menuStyle}
      className="rounded-lg border border-border bg-card shadow-lg max-h-60 overflow-y-auto"
    >
      {suggestions.map((item, idx) => (
        <li
          key={`${item.lat}-${item.lon}-${idx}`}
          onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
          onMouseEnter={() => setHighlightedIdx(idx)}
          className={`cursor-pointer px-3 py-2 text-sm transition-colors ${idx === highlightedIdx ? "bg-primary/10 text-primary" : "hover:bg-muted"}`}
        >
          <span className="block font-medium truncate">{item.city || item.display_name.split(",")[0]}</span>
          <span className="block text-xs text-muted-foreground truncate">
            {[item.country, item.display_name.split(",").slice(1).join(",").trim()].filter(Boolean).join(" — ")}
          </span>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div>
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (suggestions.length > 0) { reposition(); setOpen(true); } }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {typeof document !== "undefined" && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}

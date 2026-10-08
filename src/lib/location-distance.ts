import { useEffect, useState } from "react";
import { getMyProfile } from "@/lib/swivv-auth";

// ponytail: ported from swoov's location-distance, upgraded from haversine to a baked-in OSRM
// road matrix (fetched 2026-09-22, directions averaged) — no runtime API, no geolib dep;
// re-fetch the OSRM table if cities are added; unknown pairs fall back to the stored distanceKm
// Order: Paris, Lyon, Marseille, Bordeaux, Lille, Toulouse, Nice, Nantes.
const CITIES = ["paris", "lyon", "marseille", "bordeaux", "lille", "toulouse", "nice", "nantes"] as const;
const ROAD_KM: Record<string, number> = {
  "lyon|paris": 466,
  "marseille|paris": 775,
  "bordeaux|paris": 585,
  "lille|paris": 220,
  "paris|toulouse": 679,
  "nice|paris": 933,
  "nantes|paris": 384,
  "lyon|marseille": 314,
  "bordeaux|lyon": 554,
  "lille|lyon": 692,
  "lyon|toulouse": 539,
  "lyon|nice": 472,
  "lyon|nantes": 685,
  "bordeaux|marseille": 646,
  "lille|marseille": 1000,
  "marseille|toulouse": 405,
  "marseille|nice": 199,
  "marseille|nantes": 987,
  "bordeaux|lille": 805,
  "bordeaux|toulouse": 246,
  "bordeaux|nice": 804,
  "bordeaux|nantes": 348,
  "lille|toulouse": 900,
  "lille|nice": 1158,
  "lille|nantes": 604,
  "nice|toulouse": 562,
  "nantes|toulouse": 586,
  "nantes|nice": 1144,
};

function norm(city: string): string {
  return city.trim().toLowerCase();
}

/** Road km between two known cities, null when either is unknown. */
export function distanceBetweenCities(
  fromCity: string | undefined,
  _fromCountry: string | undefined,
  toCity: string,
  _toCountry: string,
): number | null {
  if (!fromCity) return null;
  const a = norm(fromCity);
  const b = norm(toCity);
  if (a === b) return 0;
  if (!CITIES.includes(a as (typeof CITIES)[number]) || !CITIES.includes(b as (typeof CITIES)[number])) {
    return null;
  }
  return ROAD_KM[[a, b].sort().join("|")] ?? null;
}

/** Real km from the viewer's city; same-city and unknown viewers keep the stored intra-city value. */
export function realDistance(
  viewerCity: string | undefined | null,
  viewerCountry: string | undefined | null,
  // ponytail: partial profiles (server rows can lack city/distance) sort last instead of crashing every caller
  p: { city?: string; country?: string; distanceKm?: number },
): number {
  const fallback = p.distanceKm ?? 9999;
  if (!viewerCity || !p.city || norm(viewerCity) === norm(p.city)) {
    return fallback;
  }
  return distanceBetweenCities(viewerCity, viewerCountry ?? "France", p.city, p.country ?? "France") ?? fallback;
}

/** Viewer's saved city (empty until the profile loads — callers fall back gracefully). */
export function useMyCity(): { city: string; country: string } {
  const [c, setC] = useState({ city: "", country: "" });
  useEffect(() => {
    let live = true;
    getMyProfile().then((p) => {
      if (live && p?.city) setC({ city: p.city, country: p.country });
    });
    return () => {
      live = false;
    };
  }, []);
  return c;
}

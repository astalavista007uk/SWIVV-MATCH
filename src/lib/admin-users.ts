// Pure user-directory logic (queries live in admin.users).
// ponytail: client-side filter/sort/page over the 500 freshest profiles — server-side ilike + count when this outgrows memory
export const DIR_PAGE_SIZE = 20;
export const COMPLETE_AT = 80;

export type DirRow = {
  user_id: string;
  data: any;
  status: string;
  updatedAt: string | null;
  completion: number;
  verified: "yes" | "pending" | "no";
  reports: number;
  hasCase: boolean;
};

export type DirFilter = {
  q: string;
  status: string;
  verified: "all" | "yes" | "pending" | "no";
  completion: "all" | "complete" | "incomplete";
  activity: "all" | "active7" | "idle30";
  registered: "all" | "new7" | "new30";
};

export function filterDir(rows: DirRow[], f: DirFilter, nowMs = Date.now()): DirRow[] {
  const needle = f.q.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.status !== "all" && r.status !== f.status) return false;
    if (f.verified !== "all" && r.verified !== f.verified) return false;
    if (f.completion === "complete" && r.completion < COMPLETE_AT) return false;
    if (f.completion === "incomplete" && r.completion >= COMPLETE_AT) return false;
    if (f.activity === "active7" && !(r.updatedAt && nowMs - new Date(r.updatedAt).getTime() < 7 * 864e5)) return false;
    if (f.activity === "idle30" && !(r.updatedAt == null || nowMs - new Date(r.updatedAt).getTime() > 30 * 864e5)) return false;
    const j = r.data?.joinedAt ? new Date(r.data.joinedAt).getTime() : NaN;
    if (f.registered === "new7" && !(Number.isFinite(j) && nowMs - j < 7 * 864e5)) return false;
    if (f.registered === "new30" && !(Number.isFinite(j) && nowMs - j < 30 * 864e5)) return false;
    if (!needle) return true;
    const d = r.data ?? {};
    return [d.name, d.city, d.email, r.user_id].some((v) => String(v ?? "").toLowerCase().includes(needle));
  });
}

export type DirSort = "recent" | "newest" | "name" | "completion";

export function sortDir(rows: DirRow[], sort: DirSort): DirRow[] {
  const t = (v: any) => (v ? new Date(v).getTime() || 0 : 0);
  const arr = [...rows];
  if (sort === "name") arr.sort((a, b) => String(a.data?.name ?? "").localeCompare(String(b.data?.name ?? ""), "fr"));
  else if (sort === "completion") arr.sort((a, b) => b.completion - a.completion);
  else if (sort === "newest") arr.sort((a, b) => t(b.data?.joinedAt) - t(a.data?.joinedAt));
  else arr.sort((a, b) => t(b.updatedAt) - t(a.updatedAt));
  return arr;
}

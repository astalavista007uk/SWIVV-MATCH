import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { audit } from "@/lib/admin";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
} as any);

function bucketize(dates: string[], days: number) {
  const out = new Array(days).fill(0) as number[];
  const now = Date.now();
  for (const d of dates) {
    const i = Math.floor((now - new Date(d).getTime()) / 864e5);
    if (i >= 0 && i < days) out[days - 1 - i]++;
  }
  return out;
}

function Bars({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(1, ...data);
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-medium text-[#333]">{label}</h2>
      <div className="mt-2 flex h-24 items-end gap-1" role="img" aria-label={`${label} : ${data.join(", ")}`}>
        {data.map((v, i) => (
          <span key={i} title={String(v)} className="min-w-0 flex-1 rounded-t bg-[#e91e63]/70" style={{ height: `${Math.max(4, (100 * v) / max)}%` }} />
        ))}
      </div>
    </section>
  );
}

// ponytail: client-side bucketing over 2000 recent rows (no created_at on swivv_profiles, updated_at used as activity proxy) — SQL date_trunc aggregation when volume grows
function AdminAnalytics() {
  const [range, setRange] = useState(30);
  const [msgs, setMsgs] = useState<number[]>([]);
  const [active, setActive] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [c, p] = await Promise.all([
        supabase.from("swivv_chats").select("created_at").order("created_at", { ascending: false }).limit(2000),
        supabase.from("swivv_profiles").select("updated_at").order("updated_at", { ascending: false }).limit(2000),
      ]);
      if (c.error) {
        setErr(c.error.message);
        return;
      }
      setMsgs(bucketize(((c.data ?? []) as any[]).map((r) => r.created_at).filter(Boolean), range));
      setActive(bucketize(((p.data ?? []) as any[]).map((r) => r.updated_at).filter(Boolean), range));
      audit("admin.analytics.view");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  if (err) return <p className="text-sm text-red-600">{err}</p>;

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-medium text-[#333]">Analytics</h1>
        <select value={range} onChange={(e) => setRange(Number(e.target.value))} aria-label="Période" className="ml-auto rounded-md border border-border bg-white px-3 py-2 text-sm">
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <Bars data={msgs} label={`Messages envoyés (${range} j)`} />
        <Bars data={active} label={`Profils actifs — màj (${range} j)`} />
      </div>
      <p className="mt-3 text-xs text-[#999]">
        Données réelles. Rétention, DAU/WAU exacts et acquisition (UTM) exigent une table d'événements — voir TODOs.
      </p>
    </div>
  );
}

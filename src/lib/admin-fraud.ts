// Fraud detection over available signals only (reports, blocks, repetition, bursts).
// ponytail: no IPs, devices, or auth logs exist — shared-source clusters are flagged as
// "possible shared source", never as proof of same person; protected attributes never signals
// ponytail: fixed thresholds passed in (rules table drives the UI) — distributions first if tuning ever needs data

export type Signal = { rule: string; label: string; detail: string; ref: string };

/** Signup bursts: N+ accounts created within windowH hours (sliding, labelled by first timestamp). */
export function burstRegs(createdAts: string[], minN = 5, windowH = 1): Signal[] {
  const ts = createdAts.map((x) => new Date(x).getTime()).filter(Number.isFinite).sort((a, b) => a - b);
  const out: Signal[] = [];
  let i = 0;
  for (let j = 0; j < ts.length; j++) {
    while (ts[j] - ts[i] > windowH * 36e5) i++;
    if (j - i + 1 >= minN) {
      out.push({
        rule: "burst-regs",
        label: `${j - i + 1} inscriptions en moins d'${windowH} h`,
        detail: `dès ${new Date(ts[i]).toLocaleString("fr-FR")} — source partagée possible, jamais une preuve d'identité commune`,
        ref: `burst:${ts[i]}`,
      });
      i = j + 1;
    }
  }
  return out;
}

/** Accounts reported by N+ independent reporters. */
export function repeatTargets(reports: { reported_user_id: string | null; reporter_id: string | null }[], minN = 3): Signal[] {
  const by = new Map<string, Set<string>>();
  for (const r of reports) {
    if (!r.reported_user_id || !r.reporter_id) continue;
    const s = by.get(r.reported_user_id) ?? new Set<string>();
    s.add(r.reporter_id);
    by.set(r.reported_user_id, s);
  }
  return [...by.entries()]
    .filter(([, s]) => s.size >= minN)
    .map(([id, s]) => ({
      rule: "repeat-targets",
      label: `Signalé par ${s.size} comptes indépendants`,
      detail: "corroboration, pas culpabilité",
      ref: id,
    }));
}

/** High-volume conversation pairs (user+peer, distinct messages, 24h scan). */
export function pairVolume(messages: { user_id: string; peer_id: string; msg_id: string }[], minN = 50): Signal[] {
  const pairs = new Map<string, Set<string>>();
  for (const m of messages) {
    const a = [m.user_id, m.peer_id].sort().join("|");
    const s = pairs.get(a) ?? new Set<string>();
    s.add(m.msg_id);
    pairs.set(a, s);
  }
  return [...pairs.entries()]
    .filter(([, s]) => s.size >= minN)
    .map(([a, s]) => ({
      rule: "pair-volume",
      label: `${s.size} messages échangés (24 h)`,
      detail: `paire ${a.split("|").map((x) => x.slice(0, 8)).join(" ↔ ")} — volume seul, jamais une preuve d'abus`,
      ref: `pair:${a}`,
    }));
}

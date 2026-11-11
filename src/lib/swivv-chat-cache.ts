// Local chat cache is a mirror for real peers, not a source of truth.
// After a successful server pull, drop cached `u:` messages the server no longer has
// (stale history from a dissolved conversation / rejected pre-acceptance sends).
// Seed/demo peers stay local-only.
//
// ponytail: 5-minute grace keeps a just-sent message that is still uploading; if a
// rejected send lands in that window it disappears on the next boot. Real outbox with
// per-message status if offline reliability ever matters.

export type CachedChat = { id: string; ts?: number };

export function chatKey(peerId: string, msgId: string): string {
  return `${peerId}\u0000${msgId}`;
}

export function pruneRealPeerChats<T extends CachedChat>(
  cache: Record<string, T[]>,
  serverKeys: Set<string>,
  now = Date.now(),
  graceMs = 5 * 60_000,
): { cache: Record<string, T[]>; removed: number } {
  let removed = 0;
  const next: Record<string, T[]> = {};
  for (const [peerId, msgs] of Object.entries(cache)) {
    if (!peerId.startsWith("u:")) {
      next[peerId] = msgs;
      continue;
    }
    const kept = msgs.filter((m) => serverKeys.has(chatKey(peerId, m.id)) || (m.ts ?? 0) >= now - graceMs);
    removed += msgs.length - kept.length;
    if (kept.length) next[peerId] = kept;
  }
  return { cache: next, removed };
}

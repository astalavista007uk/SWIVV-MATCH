import { describe, expect, test } from "bun:test";
import { chatKey, pruneRealPeerChats } from "../src/lib/swivv-chat-cache";

const NOW = 1_800_000_000_000;
const PEER = "u:22222222-2222-2222-2222-222222222222";

describe("chat cache pruning", () => {
  test("drops stale real-peer messages the server no longer has", () => {
    const cache = {
      [PEER]: [
        { id: "old-1", ts: NOW - 10 * 60_000 },
        { id: "old-2", ts: NOW - 60 * 60_000 },
      ],
    };
    const res = pruneRealPeerChats(cache, new Set(), NOW);
    expect(res.removed).toBe(2);
    expect(res.cache[PEER]).toBeUndefined();
  });

  test("keeps messages confirmed by the server and recent sends", () => {
    const cache = {
      [PEER]: [
        { id: "kept", ts: NOW - 60 * 60_000 },
        { id: "just-sent", ts: NOW - 20_000 },
        { id: "stale", ts: NOW - 30 * 60_000 },
      ],
    };
    const res = pruneRealPeerChats(cache, new Set([chatKey(PEER, "kept")]), NOW);
    expect(res.cache[PEER].map((m) => m.id)).toEqual(["kept", "just-sent"]);
    expect(res.removed).toBe(1);
  });

  test("never prunes local seed/demo threads", () => {
    const cache = { "12": [{ id: "seed-1", ts: NOW - 999_999_999 }] };
    const res = pruneRealPeerChats(cache, new Set(), NOW);
    expect(res.removed).toBe(0);
    expect(res.cache["12"]).toHaveLength(1);
  });

  test("a dissolved conversation disappears once its messages age out", () => {
    const cache = { [PEER]: [{ id: "m", ts: NOW - 6 * 60_000 }] };
    expect(pruneRealPeerChats(cache, new Set(), NOW).cache[PEER]).toBeUndefined();
  });
});

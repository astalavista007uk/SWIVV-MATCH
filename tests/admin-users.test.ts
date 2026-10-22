import { describe, expect, test } from "bun:test";
import { filterDir, sortDir, type DirRow } from "../src/lib/admin-users";

const rows: DirRow[] = [
  { user_id: "a", data: { name: "Zoe", city: "Paris", joinedAt: "2026-10-11" }, status: "active", updatedAt: "2026-10-12T10:00:00Z", completion: 90, verified: "yes", reports: 0, hasCase: false },
  { user_id: "b", data: { name: "Ali", city: "Lyon", joinedAt: "2026-01-01" }, status: "suspended", updatedAt: "2026-01-05T10:00:00Z", completion: 40, verified: "no", reports: 3, hasCase: true },
  { user_id: "c", data: { name: "Mia", city: "Nice" }, status: "active", updatedAt: null, completion: 85, verified: "pending", reports: 1, hasCase: false },
];
const now = new Date("2026-10-12T12:00:00Z").getTime();
const base = { q: "", status: "all", verified: "all", completion: "all", activity: "all", registered: "all" } as const;

describe("filterDir", () => {
  test("search matches name, city, id", () => {
    expect(filterDir(rows, { ...base, q: "lyon" }, now).map((r) => r.user_id)).toEqual(["b"]);
    expect(filterDir(rows, { ...base, q: "C" }, now).map((r) => r.user_id)).toEqual(["c"]);
  });
  test("status + verified + completion filters", () => {
    expect(filterDir(rows, { ...base, status: "suspended" }, now).map((r) => r.user_id)).toEqual(["b"]);
    expect(filterDir(rows, { ...base, verified: "pending" }, now).map((r) => r.user_id)).toEqual(["c"]);
    expect(filterDir(rows, { ...base, completion: "incomplete" }, now).map((r) => r.user_id)).toEqual(["b"]);
  });
  test("activity + registration windows", () => {
    expect(filterDir(rows, { ...base, activity: "active7" }, now).map((r) => r.user_id)).toEqual(["a"]);
    expect(filterDir(rows, { ...base, activity: "idle30" }, now).map((r) => r.user_id).sort()).toEqual(["b", "c"]);
    expect(filterDir(rows, { ...base, registered: "new7" }, now).map((r) => r.user_id)).toEqual(["a"]);
    expect(filterDir(rows, { ...base, registered: "new30" }, now).map((r) => r.user_id)).toEqual(["a"]);
  });
});

describe("sortDir", () => {
  test("recent puts freshest first, unknown last", () => {
    expect(sortDir(rows, "recent").map((r) => r.user_id)).toEqual(["a", "b", "c"]);
  });
  test("name sorts French-locale", () => {
    expect(sortDir(rows, "name").map((r) => r.user_id)).toEqual(["b", "c", "a"]);
  });
});

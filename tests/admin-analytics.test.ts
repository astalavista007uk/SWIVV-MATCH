import { describe, expect, test } from "bun:test";
import { median, toCsv } from "../src/lib/admin-metrics";

describe("median", () => {
  test("middle and averaged middles", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBe(null);
  });
});

describe("toCsv", () => {
  test("header + quoted rows", () => {
    const csv = toCsv(["day", "n"], [["12 oct.", 3], ['a"b', 1]]);
    expect(csv).toBe('day,n\n12 oct.,3\n"a""b",1');
  });
});

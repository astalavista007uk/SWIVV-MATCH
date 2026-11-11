import { describe, expect, test } from "bun:test";
import { langFromCountry } from "../src/lib/i18n";

describe("geo language", () => {
  test("french-speaking countries and french-second-language countries", () => {
    for (const cc of ["FR", "BE", "LU", "MC", "CH", "DZ", "MA", "TN", "SN", "CI", "CM", "HT"])
      expect(langFromCountry(cc)).toBe("fr");
  });

  test("spain, mexico, latam and the spanish-speaking islands", () => {
    for (const cc of ["ES", "MX", "AR", "CO", "CL", "PE", "CU", "DO", "PR", "GQ"])
      expect(langFromCountry(cc)).toBe("es");
  });

  test("english-speaking world and everyone else", () => {
    for (const cc of ["US", "GB", "SE", "NO", "DK", "NG", "ZA", "DE", "JP", "BR"])
      expect(langFromCountry(cc)).toBe("en");
  });

  test("canada splits on province", () => {
    expect(langFromCountry("CA", "QC")).toBe("fr");
    expect(langFromCountry("ca", "qc")).toBe("fr");
    expect(langFromCountry("CA", "ON")).toBe("en");
    expect(langFromCountry("CA")).toBe("en");
  });

  test("no country header (local dev, other hosts) keeps french", () => {
    expect(langFromCountry(undefined)).toBe("fr");
    expect(langFromCountry("")).toBe("fr");
  });
});

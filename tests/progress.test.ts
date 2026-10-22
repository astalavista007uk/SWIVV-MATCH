import { describe, expect, test } from "bun:test";
import {
  achievements,
  dayOrdinal,
  lastDays,
  periodStats,
  profileCompleteness,
  qualifyingDays,
  streak,
  weeklyReplies,
  windowStart,
  type ChatRow,
} from "../src/lib/swivv-progress";
import { nextProfileStep } from "../src/lib/swivv-profile-fields";
import type { SwivvProfile } from "../src/lib/swivv-data";

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();

const profile = (over: Partial<SwivvProfile> = {}): SwivvProfile =>
  ({
    name: "Alex",
    gender: "woman",
    seeking: "man",
    city: "Paris",
    country: "France",
    lookingFor: "Relation sérieuse",
    maritalStatus: "Célibataire",
    tagline: "Curieuse de tout",
    bio: "J'aime lire, voyager et cuisiner pour mes proches.",
    heightCm: 168,
    weightKg: 58,
    hairColor: "Brun",
    eyeColor: "Marron",
    bodyStyle: "Mince",
    ethnicity: "Européenne",
    selfAppearance: "Naturel",
    bestFeature: "Le sourire",
    occupation: "Architecte",
    education: "Master",
    drink: "Occasionnel",
    smoke: "Jamais",
    drugs: "Jamais",
    eatingHabits: "Équilibré",
    employmentStatus: "Salarié",
    annualIncome: "35 000 €",
    livingSituation: "Seul(e)",
    willingToRelocate: "Peut-être",
    hasPets: "Non",
    wantsMorePets: "Non",
    haveChildren: "Non",
    wantMoreChildren: "Peut-être",
    brothersCount: 1,
    sistersCount: 1,
    birthRank: "Aîné(e)",
    parentsMaritalStatus: "Mariés",
    nationality: "Française",
    firstLanguage: "Français",
    bornOrConverted: "Né(e) dans la religion",
    religion: "Aucune",
    religiousValues: "Modérées",
    familyValues: "Importantes",
    interests: ["lecture"],
    photos: ["photo"],
    ...over,
  }) as SwivvProfile;

const msg = (peer: string, sender: "me" | "them", ts: number): ChatRow => ({
  peer,
  sender,
  at: ts,
});

describe("calendar days", () => {
  test("milestone before/after midnight are different local days", () => {
    expect(dayOrdinal(at(2026, 10, 20, 23))).toBe(dayOrdinal(at(2026, 10, 20, 1)));
    expect(dayOrdinal(at(2026, 10, 21, 0)) - dayOrdinal(at(2026, 10, 20, 23))).toBe(1);
  });

  test("spring DST does not skip or repeat a day ordinal", () => {
    const d1 = dayOrdinal(at(2026, 3, 28));
    const d2 = dayOrdinal(at(2026, 3, 29));
    const d3 = dayOrdinal(at(2026, 3, 30));
    expect(d2 - d1).toBe(1);
    expect(d3 - d2).toBe(1);
  });

  test("windowStart is local midnight N-1 days back", () => {
    const start = new Date(windowStart(at(2026, 10, 20), 7));
    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(14);
  });

  test("windowStart survives the autumn DST change", () => {
    const start = new Date(windowStart(at(2026, 10, 30), 7));
    expect(start.getHours()).toBe(0);
    expect(start.getDate()).toBe(24);
  });

  test("lastDays returns 7 consecutive ordinals ending today", () => {
    const days = lastDays(at(2026, 10, 20), 7);
    expect(days).toHaveLength(7);
    expect(days[6]).toBe(dayOrdinal(at(2026, 10, 20)));
    expect(days[0]).toBe(dayOrdinal(at(2026, 10, 14)));
  });
});

describe("streak", () => {
  const now = at(2026, 10, 20);

  test("zero activity", () => {
    expect(streak([], now)).toEqual({ current: 0, best: 0, activeToday: false });
  });

  test("one day today", () => {
    expect(streak([dayOrdinal(now)], now)).toEqual({ current: 1, best: 1, activeToday: true });
  });

  test("consecutive days", () => {
    const days = [18, 19, 20].map((d) => dayOrdinal(at(2026, 10, d)));
    expect(streak(days, now)).toEqual({ current: 3, best: 3, activeToday: true });
  });

  test("a missed day resets the current run", () => {
    const days = [17, 18, 20].map((d) => dayOrdinal(at(2026, 10, d)));
    expect(streak(days, now)).toEqual({ current: 1, best: 2, activeToday: true });
  });

  test("yesterday still counts while today is untouched", () => {
    const days = [18, 19].map((d) => dayOrdinal(at(2026, 10, d)));
    expect(streak(days, now)).toEqual({ current: 2, best: 2, activeToday: false });
  });

  test("a gap of two days drops the current streak", () => {
    const days = [dayOrdinal(at(2026, 10, 17)), dayOrdinal(at(2026, 10, 18))];
    expect(streak(days, now).current).toBe(0);
  });

  test("duplicate events do not inflate anything", () => {
    const d = dayOrdinal(now);
    expect(streak([d, d, d], now).current).toBe(1);
  });

  test("a future date never extends the best streak", () => {
    expect(streak([dayOrdinal(at(2026, 10, 21))], now).best).toBe(0);
  });
});

describe("qualifying days", () => {
  const now = at(2026, 10, 20);

  test("a mutual match qualifies its day", () => {
    const days = qualifyingDays([], [{ other: "x", at: now }]);
    expect([...days.keys()]).toEqual([dayOrdinal(now)]);
  });

  test("one-way messages never qualify", () => {
    expect(qualifyingDays([msg("x", "me", now), msg("x", "me", now - 1000)], []).size).toBe(0);
  });

  test("my messages in a two-way thread qualify only the days I wrote", () => {
    const days = qualifyingDays([msg("x", "them", at(2026, 10, 18)), msg("x", "me", now)], []);
    expect([...days.keys()]).toEqual([dayOrdinal(now)]);
  });

  test("several events on one day stay a single day", () => {
    const days = qualifyingDays(
      [msg("x", "them", now), msg("x", "me", now), msg("x", "me", now + 5000)],
      [],
    );
    expect(days.size).toBe(1);
  });
});

describe("weekly goal", () => {
  const now = at(2026, 10, 20);

  test("replying after their message counts", () => {
    expect(weeklyReplies([msg("x", "them", at(2026, 10, 19)), msg("x", "me", now)], now)).toBe(1);
  });

  test("sending before they wrote is not a reply", () => {
    expect(weeklyReplies([msg("x", "me", at(2026, 10, 19)), msg("x", "them", now)], now)).toBe(0);
  });

  test("old replies fall outside the 7-day window", () => {
    expect(
      weeklyReplies([msg("x", "them", at(2026, 10, 1)), msg("x", "me", at(2026, 10, 2))], now),
    ).toBe(0);
  });

  test("distinct peers, not message volume", () => {
    const chats = [
      msg("a", "them", at(2026, 10, 19)),
      msg("a", "me", now),
      msg("a", "me", now + 1000),
      msg("b", "them", at(2026, 10, 19)),
      msg("b", "me", now),
    ];
    expect(weeklyReplies(chats, now)).toBe(2);
  });
});

describe("profile completion", () => {
  test("empty profile is 0 %", () => {
    expect(profileCompleteness(null)).toBe(0);
    expect(profileCompleteness({} as SwivvProfile)).toBe(0);
  });

  test("full profile is 100 %", () => {
    expect(profileCompleteness(profile())).toBe(100);
  });

  test("partial profile sits between", () => {
    const pct = profileCompleteness(profile({ bio: "", photos: [], interests: [] }));
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });

  test("blank and placeholder-only values never count", () => {
    expect(profileCompleteness(profile({ tagline: "   " }))).toBe(
      profileCompleteness(profile({ tagline: "" })),
    );
  });

  test("zero is a valid number field", () => {
    expect(profileCompleteness(profile({ heightCm: 0 }))).toBe(100);
  });

  test("next step points at the first gap", () => {
    expect(nextProfileStep({} as SwivvProfile)?.field).toBe("name");
    expect(nextProfileStep(profile({ photos: [] }))).toEqual({
      field: "photos",
      label: "Photos",
      to: "/mon-profil",
    });
    expect(nextProfileStep(profile())).toBeNull();
  });
});

describe("achievements", () => {
  const now = at(2026, 10, 20);
  const base = { profile: profile(), chats: [], matches: [], now };
  const byId = (list: ReturnType<typeof achievements>, id: string) =>
    list.find((a) => a.id === id)!;

  test("all conditions met unlocks five available badges", () => {
    const matches = [17, 18, 19, 20].map((d) => ({ other: `m${d}`, at: at(2026, 10, d) }));
    const chats = [
      msg("x", "them", at(2026, 10, 18)),
      msg("x", "me", at(2026, 10, 19)),
      // 5th qualifying day comes from a match on the 15th
    ];
    matches.push({ other: "m15", at: at(2026, 10, 15) });
    const list = achievements({ ...base, matches, chats });
    expect(
      list
        .filter((a) => a.unlocked)
        .map((a) => a.id)
        .sort(),
    ).toEqual(["connector", "ready", "spark", "starter", "twoWay"]);
  });

  test("zero activity unlocks nothing", () => {
    const list = achievements({ ...base, profile: null });
    expect(list.filter((a) => a.unlocked)).toHaveLength(0);
  });

  test("partial profile keeps Ready to Meet locked", () => {
    const list = achievements({ ...base, profile: profile({ bio: "" }) });
    expect(byId(list, "ready").unlocked).toBe(false);
  });

  test("a dateless local match unlocks First Spark without inventing a date", () => {
    const list = achievements({ ...base, matches: [{ other: "seed", at: 0 }] });
    expect(byId(list, "spark").unlocked).toBe(true);
    expect(byId(list, "spark").at).toBeNull();
  });

  test("Conversation Starter needs a sent message", () => {
    const list = achievements({ ...base, chats: [msg("x", "them", now)] });
    expect(byId(list, "starter").unlocked).toBe(false);
    expect(byId(list, "twoWay").unlocked).toBe(false);
  });

  test("Two-Way Connection dates from the second voice", () => {
    const mine = at(2026, 10, 18);
    const theirs = at(2026, 10, 19);
    const list = achievements({ ...base, chats: [msg("x", "me", mine), msg("x", "them", theirs)] });
    expect(byId(list, "twoWay").unlocked).toBe(true);
    expect(byId(list, "twoWay").at).toBe(theirs);
  });

  test("Consistent Connector needs five distinct days and dates the fifth", () => {
    const four = achievements({
      ...base,
      matches: [16, 17, 18, 19, 19].map((d) => ({ other: `m${d}`, at: at(2026, 10, d) })),
    });
    expect(byId(four, "connector").unlocked).toBe(false);
    const five = achievements({
      ...base,
      matches: [16, 17, 18, 19, 20].map((d) => ({ other: `m${d}`, at: at(2026, 10, d) })),
    });
    expect(byId(five, "connector").unlocked).toBe(true);
    expect(byId(five, "connector").at).toBe(at(2026, 10, 20));
  });

  test("Community Champion stays unavailable, never faked", () => {
    const champion = byId(achievements(base), "champion");
    expect(champion.available).toBe(false);
    expect(champion.unlocked).toBe(false);
  });

  test("repeated evaluation is idempotent (one entry per badge)", () => {
    const list = achievements(base);
    expect(list).toHaveLength(6);
    expect(new Set(list.map((a) => a.id)).size).toBe(6);
    expect(achievements(base).map((a) => a.unlocked)).toEqual(list.map((a) => a.unlocked));
  });
});

describe("period statistics", () => {
  const now = at(2026, 10, 20);
  const chats = [
    msg("a", "me", at(2026, 10, 19)),
    msg("a", "them", at(2026, 10, 20)),
    msg("b", "them", at(2026, 9, 25)),
    msg("b", "me", at(2026, 9, 26)),
  ];
  const matches = [
    { other: "m1", at: at(2026, 10, 18) },
    { other: "m2", at: at(2026, 9, 26) },
    { other: "seed", at: 0 },
  ];
  const visits = [at(2026, 10, 20), at(2026, 9, 26)];

  test("7-day window ignores older rows and dateless matches", () => {
    const s = periodStats({ chats, matches, visits, now, days: 7 });
    expect(s).toEqual({ matches: 1, started: 1, twoWay: 1, visits: 1, activeDays: 2 });
  });

  test("30-day window includes September activity", () => {
    const s = periodStats({ chats, matches, visits, now, days: 30 });
    expect(s.matches).toBe(2);
    expect(s.started).toBe(2);
    expect(s.twoWay).toBe(2);
    expect(s.visits).toBe(2);
  });

  test("new member sees zeros, not blanks", () => {
    expect(periodStats({ chats: [], matches: [], visits: [], now, days: 7 })).toEqual({
      matches: 0,
      started: 0,
      twoWay: 0,
      visits: 0,
      activeDays: 0,
    });
  });

  test("window boundary is the local midnight of day N-1", () => {
    const boundary = windowStart(now, 7);
    const inside = periodStats({
      chats: [],
      matches: [{ other: "x", at: boundary }],
      visits: [],
      now,
      days: 7,
    });
    const outside = periodStats({
      chats: [],
      matches: [{ other: "x", at: boundary - 1 }],
      visits: [],
      now,
      days: 7,
    });
    expect(inside.matches).toBe(1);
    expect(outside.matches).toBe(0); // one millisecond before local midnight belongs to the previous day
  });

  test("duplicate messages from one peer count as one two-way conversation", () => {
    const s = periodStats({
      chats: [msg("a", "me", now), msg("a", "me", now + 1000), msg("a", "them", now + 2000)],
      matches: [],
      visits: [],
      now,
      days: 7,
    });
    expect(s.started).toBe(1);
    expect(s.twoWay).toBe(1);
  });
});

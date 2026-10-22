// ponytail: hand-rolled 0-3 scorer (zxcvbn would add ~800KB for a signup hint — upgrade if requirements ever pass length/classes/common-list)
const COMMON = [
  "password", "123456", "12345678", "azerty", "qwerty", "abc123",
  "letmein", "welcome", "monamour", "amour", "bonjour", "swivv",
  "football", "sunshine", "iloveyou", "admin", "000000",
];

export const PW_LEVELS = [
  { label: "Very Weak", color: "#DC2626" },
  { label: "Weak", color: "#F97316" },
  { label: "Good", color: "#22C55E" },
  { label: "Very Strong", color: "#16A34A" },
] as const;

// -1 = empty (neutral meter, no label), 0-3 = Very Weak..Very Strong. Local-only, no network.
export function pwScore(pw: string): number {
  if (!pw) return -1;
  if (pw.length < 6) return 0;
  if (pw.length < 12 && COMMON.some((c) => pw.toLowerCase().includes(c))) return 0;
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].reduce((n, re) => n + (re.test(pw) ? 1 : 0), 0);
  let s = 0;
  if (pw.length >= 8) s = 1;
  if ((pw.length >= 8 && classes >= 3) || (pw.length >= 10 && classes >= 2)) s = 2;
  if ((pw.length >= 12 && classes >= 3) || (pw.length >= 16 && classes >= 2)) s = 3;
  return s;
}

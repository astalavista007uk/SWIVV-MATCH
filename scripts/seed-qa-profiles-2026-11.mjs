#!/usr/bin/env node
// Seed a second admin-only QA batch: 60 mixed-gender profiles, one photo each.
// Safety: dry-run by default. Writing requires BOTH --apply and SWIVV_TEST_SEED=1.
// Accounts use reserved @example.com emails, email_confirm (no mail is sent),
// testAccount/testBatch, and profileHidden. They are visible in Admin > Utilisateurs,
// not in the public feed.
//
// ponytail: generated personas, not a CMS — replace the arrays if the batch needs
// different demographics. Reuses the installed @supabase/supabase-js.
//
//   bun scripts/seed-qa-profiles-2026-11.mjs
//   SWIVV_TEST_SEED=1 bun scripts/seed-qa-profiles-2026-11.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BATCH = process.env.SWIVV_TEST_BATCH ?? "qa-2026-11";
const APPLY = process.argv.includes("--apply");
const DOMAIN = "example.com";

if (APPLY && process.env.SWIVV_TEST_SEED !== "1") {
  console.error("Refusing to write: set SWIVV_TEST_SEED=1 to confirm.");
  process.exit(1);
}

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required (see .env).");
  process.exit(1);
}

const U = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=faces&w=400&q=70`;

const WOMEN_IDS = [
  "photo-1494790108377-be9c29b29330",
  "photo-1438761681033-6461ffad8d80",
  "photo-1544005313-94ddf0286df2",
  "photo-1531123897727-8f129e1688ce",
  "photo-1489424731084-a5d8b219a5bb",
  "photo-1524504388940-b1c1722653e1",
  "photo-1517841905240-472988babdf9",
  "photo-1534528741775-53994a69daeb",
  "photo-1508214751196-bcfd4ca60f91",
  "photo-1529626455594-4ff0802cfb7e",
  "photo-1487412720507-e7ab37603c6f",
  "photo-1492106087820-71f1a00d2b11",
  "photo-1520813792240-56fc4a3765a7",
  "photo-1531746020798-e6953c6e8e04",
  "photo-1488426862026-3ee34a7d66df",
  "photo-1502823403499-6ccfcf4fb453",
  "photo-1524250502761-1ac6f2e30d43",
  "photo-1469334031218-e382a71b716b",
  "photo-1521146764736-56c929d59c83",
  "photo-1506863530036-1efeddceb993",
  "photo-1512314889357-e157c22f938d",
  "photo-1496747611176-843222e1e57c",
  "photo-1509631179647-0177331693ae",
  "photo-1519699047748-de8e457a634e",
  "photo-1544725176-7c40e5a71c5e",
];
const MEN_IDS = [
  "photo-1500648767791-00dcc994a43e",
  "photo-1506794778202-cad84cf45f1d",
  "photo-1472099645785-5658abf4ff4e",
  "photo-1507003211169-0a1dd7228f2d",
  "photo-1519085360753-af0119f7cbe7",
  "photo-1492562080023-ab3db95bfbce",
  "photo-1463453091185-61582044d556",
  "photo-1504257432389-52343af06ae3",
  "photo-1499996860823-5214fcc65f8f",
  "photo-1508341591423-4347099e1f19",
  "photo-1519345182560-3f2917c472ef",
  "photo-1521119989659-a83eee488004",
  "photo-1520975954732-35dd22299614",
  "photo-1480429370139-e0132c086e2a",
  "photo-1506277886164-e25aa3f4ef7f",
  "photo-1539571696357-5a69c17a67c6",
  "photo-1552058544-f2b08422138a",
  "photo-1542909168-82c3e7fdca5c",
  "photo-1547425260-76bcadfb4f2c",
  "photo-1556157382-97eda2d62296",
  "photo-1560250097-0b93528c311a",
  "photo-1570295999919-56ceb5ecca61",
  "photo-1568602471122-7832951cc4c5",
  "photo-1595152772835-219674b2a8a6",
  "photo-1520975661595-6453be3f7070",
  "photo-1557862921-37829c790f19",
  "photo-1517070208541-6ddc4d3efbcb",
  "photo-1541101767792-f9b2b1c4f127",
  "photo-1599566150163-29194dcaad36",
  "photo-1531427186611-ecfd6d936c79",
  "photo-1552374196-1ab2a1c593e8",
  "photo-1566492031773-4f4e44671857",
  "photo-1583864697784-a0efc8379f70",
];

const WOMEN_PHOTOS = [...WOMEN_IDS.map(U), "https://randomuser.me/api/portraits/women/45.jpg"];
const MEN_PHOTOS = [...MEN_IDS.map(U), "https://randomuser.me/api/portraits/men/75.jpg"];

const WOMEN_NAMES = [
  "Emma", "Léa", "Chloé", "Inès", "Camille", "Sofia", "Jade", "Manon", "Louise", "Alice",
  "Sarah", "Julie", "Clara", "Nina", "Eva", "Lina", "Maya", "Ana", "Lucie", "Élodie",
  "Amélie", "Céline", "Nadia", "Fatou", "Aïcha", "Yasmine",
];
const MEN_NAMES = [
  "Hugo", "Lucas", "Nathan", "Louis", "Gabriel", "Adam", "Raphaël", "Arthur", "Jules", "Ethan",
  "Noah", "Liam", "Théo", "Tom", "Enzo", "Mathis", "Antoine", "Maxime", "Thomas", "Julien",
  "Karim", "Mehdi", "Samuel", "David", "Paul", "Marc", "Yann", "Alexandre", "Baptiste", "Romain",
  "Victor", "Simon", "Olivier", "Daniel",
];

const CITIES = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse", "Nantes", "Nice", "Strasbourg", "Montpellier", "Rennes", "Grenoble", "Rouen", "Dijon", "Reims"];
const WOMEN_JOBS = ["Graphiste", "Architecte", "Infirmière", "Professeure", "Pharmacienne", "Comptable", "Étudiante", "Photographe", "Journaliste", "Avocate", "Médecin", "Cheffe de cuisine", "Artisane", "Commerciale", "Musicienne", "Enseignante", "Retraitée", "Sage-femme"];
const MEN_JOBS = ["Développeur", "Architecte", "Infirmier", "Professeur", "Pharmacien", "Comptable", "Étudiant", "Photographe", "Journaliste", "Avocat", "Médecin", "Chef de cuisine", "Artisan", "Commercial", "Musicien", "Enseignant", "Retraité", "Ingénieur"];
const EDUCATION = ["Bac+2", "Licence", "Master", "BTS", "Doctorat"];
const INTERESTS = ["Voyages", "Musique", "Cuisine", "Sport", "Cinéma", "Lecture", "Nature", "Art", "Photographie", "Danse", "Randonnée", "Yoga", "Jeux", "Concerts", "Marchés"];
const LOOKING = ["Relation sérieuse", "Relation amoureuse", "Mariage"];
const TAGLINES = [
  "Expos le dimanche, vinyles le samedi",
  "Trail, fromage et un peu de code",
  "Le soleil, la mer et un bon livre",
  "Cinéma, ramen et expos gratuites",
  "Rugby le samedi, lecture le dimanche",
  "Jardin, théâtre, petits-enfants",
  "Vélo le matin, pétanque le soir",
  "Concerts, voyages et dimanches tranquilles",
  "Cuisine pour ceux que j'aime",
  "Balades, marchés et longues discussions",
  "Photo, nature et cafés tardifs",
  "Famille, amis et projets à deux",
];

const base = {
  country: "France",
  distanceKm: 0,
  maritalStatus: "Célibataire",
  religion: "Sans religion",
  drink: "Occasionnellement",
  smoke: "Non",
  drugs: "Jamais",
  eatingHabits: "Omnivore",
  haveChildren: "Non",
  wantMoreChildren: "Peut-être",
  employmentStatus: "En activité",
  livingSituation: "Seul(e)",
  willingToRelocate: "maybe",
  hasPets: "Non",
  firstLanguage: "français",
};

function build(gender, names, photos) {
  const isWoman = gender === "woman";
  const jobs = isWoman ? WOMEN_JOBS : MEN_JOBS;
  return names.map((name, i) => {
    const city = CITIES[i % CITIES.length];
    const occupation = jobs[i % jobs.length];
    const lookingFor = LOOKING[i % LOOKING.length];
    const interests = [0, 3, 7, 11].map((n) => INTERESTS[(i + n) % INTERESTS.length]);
    const sameSex = isWoman ? i % 9 === 8 : i % 11 === 10;
    const age = 22 + ((i * 7) % 43);
    const photo = photos[i % photos.length];
    return {
      slug: `${isWoman ? "w" : "m"}${String(i + 1).padStart(2, "0")}`,
      name,
      age,
      gender,
      seeking: sameSex ? gender : isWoman ? "man" : "woman",
      city,
      occupation,
      lookingFor,
      tagline: TAGLINES[i % TAGLINES.length],
      bio: `${occupation} à ${city}. J'aime ${interests[0].toLowerCase()}, ${interests[1].toLowerCase()} et ${interests[2].toLowerCase()}. Je cherche ${lookingFor.toLowerCase()}, sans me prendre au sérieux.`,
      photos: [photo],
      photo,
      education: EDUCATION[i % EDUCATION.length],
      heightCm: isWoman ? 156 + ((i * 3) % 30) : 168 + ((i * 3) % 26),
      interests,
      languages: ["Français", ...(i % 3 === 0 ? ["Anglais"] : []), ...(i % 5 === 0 ? ["Espagnol"] : [])],
      online: i % 3 === 0,
      verified: i % 4 === 0,
      joinedAt: new Date(Date.now() - (i % 45) * 86_400_000).toISOString(),
      lastActive: new Date(Date.now() - (i % 7) * 86_400_000).toISOString(),
      compatibility: 0,
    };
  });
}

const PERSONAS = [...build("woman", WOMEN_NAMES, WOMEN_PHOTOS), ...build("man", MEN_NAMES, MEN_PHOTOS)];
const now = new Date().toISOString();
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const projectRef = url.replace(/^https?:\/\//, "").split(".")[0];

function makePassword() {
  return randomBytes(24).toString("base64url");
}

async function findUserByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

console.log(`Batch      : ${BATCH}`);
console.log(`Supabase   : project ${projectRef}`);
console.log(`Mode       : ${APPLY ? "APPLY (writes)" : "dry-run"}`);
console.log(`Personas   : ${PERSONAS.length} (${WOMEN_NAMES.length} women, ${MEN_NAMES.length} men)\n`);

const manifest = [];
for (const p of PERSONAS) {
  const email = `swivv-${BATCH}-${p.slug}@${DOMAIN}`;
  if (!APPLY) {
    console.log(`[plan] ${p.slug} ${p.name}, ${p.age} ${p.city} <${email}>`);
    continue;
  }
  const password = makePassword();
  let user = await findUserByEmail(email);
  if (user) {
    const { error } = await sb.auth.admin.updateUserById(user.id, { password, email_confirm: true });
    if (error) throw error;
  } else {
    const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw error;
    user = data.user;
  }
  const data = {
    ...base,
    ...p,
    id: `u:${user.id}`,
    testAccount: true,
    testBatch: BATCH,
    profileHidden: true,
  };
  const { error: upErr } = await sb.from("swivv_profiles").upsert({ user_id: user.id, data, updated_at: now });
  if (upErr) throw upErr;
  manifest.push({ id: p.slug, userId: user.id, displayName: p.name, age: p.age, city: p.city, email, password, batch: BATCH, hidden: true });
  console.log(`[ok]   ${p.slug} ${p.name} <${email}>`);
}

if (APPLY) {
  const dir = join(process.cwd(), "secrets");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const file = join(dir, `test-credentials-${BATCH}.json`);
  writeFileSync(file, JSON.stringify({ batch: BATCH, project: projectRef, createdAt: now, accounts: manifest }, null, 2), { mode: 0o600 });
  writeFileSync(join(dir, `test-emails-${BATCH}.txt`), manifest.map((x) => x.email).join("\n") + "\n", { mode: 0o600 });
  console.log(`\nManifest: ${file} (${manifest.length} accounts, git-ignored, no passwords printed)`);
  console.log(`Emails  : ${join(dir, `test-emails-${BATCH}.txt`)}`);
} else {
  console.log("\nNothing written. Re-run with SWIVV_TEST_SEED=1 and --apply to seed.");
}

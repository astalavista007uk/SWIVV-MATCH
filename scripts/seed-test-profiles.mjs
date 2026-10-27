#!/usr/bin/env node
// Seed the synthetic QA profiles described in reports/swivv-qa/test-profiles.md.
//
// Safety: dry-run by default. Writing requires BOTH --apply and SWIVV_TEST_SEED=1.
// Accounts are created with email_confirm so no mail is ever sent. Rows carry
// testAccount/testBatch and profileHidden so real members never see them.
//
// ponytail: one-shot admin script, no CLI framework / config layer - add flags when a
// second batch needs variants. Reuses the installed @supabase/supabase-js.
//
//   bun scripts/seed-test-profiles.mjs            # plan only
//   SWIVV_TEST_SEED=1 bun scripts/seed-test-profiles.mjs --apply

import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BATCH = process.env.SWIVV_TEST_BATCH ?? "qa-2026-10";
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

// Same photo set already used by src/lib/swivv-data.ts - no download, no new assets.
const W = (i) => `https://images.unsplash.com/${[
  "photo-1494790108377-be9c29b29330", "photo-1438761681033-6461ffad8d80",
  "photo-1544005313-94ddf0286df2", "photo-1531123897727-8f129e1688ce",
  "photo-1489424731084-a5d8b219a5bb", "photo-1524504388940-b1c1722653e1",
  "photo-1517841905240-472988babdf9", "photo-1534528741775-53994a69daeb",
  "photo-1508214751196-bcfd4ca60f91", "photo-1529626455594-4ff0802cfb7e",
  "photo-1487412720507-e7ab37603c6f", "photo-1492106087820-71f1a00d2b11",
  "photo-1520813792240-56fc4a3765a7", "photo-1531746020798-e6953c6e8e04",
][i % 14]}?auto=format&fit=crop&crop=faces&w=400&q=70`;
const M = (i) => `https://images.unsplash.com/${[
  "photo-1500648767791-00dcc994a43e", "photo-1506794778202-cad84cf45f1d",
  "photo-1472099645785-5658abf4ff4e", "photo-1507003211169-0a1dd7228f2d",
  "photo-1519085360753-af0119f7cbe7", "photo-1492562080023-ab3db95bfbce",
  "photo-1463453091185-61582044d556", "photo-1504257432389-52343af06ae3",
][i % 8]}?auto=format&fit=crop&crop=faces&w=400&q=70`;

const base = {
  country: "France",
  distanceKm: 0,
  online: false,
  verified: false,
  maritalStatus: "Célibataire",
  religion: "Sans religion",
  heightCm: 170,
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
  interests: ["Voyages", "Musique", "Cuisine"],
  languages: ["Français"],
  firstLanguage: "français",
};

/** @type {Array<{slug:string,name:string,age:number,gender:"woman"|"man",seeking:"woman"|"man",city:string,occupation:string,lookingFor:string,photos:string[],languages:string[],firstLanguage:string,tagline:string,bio:string,extra?:object}>} */
const PERSONAS = [
  { slug: "t01", name: "Camille", age: 24, gender: "woman", seeking: "man", city: "Paris", occupation: "Graphiste", lookingFor: "Relation sérieuse", photos: [W(0), W(1), W(2)], languages: ["Français", "Anglais"], firstLanguage: "français", tagline: "Expos le dimanche, vinyles le samedi", bio: "Graphiste à Paris. Je cherche quelqu'un de drôle et curieux, qui aime les expos et les week-ends improvisés. Ici pour du sérieux, sans se prendre au sérieux." },
  { slug: "t02", name: "Hugo", age: 27, gender: "man", seeking: "woman", city: "Lyon", occupation: "Développeur", lookingFor: "Relation amoureuse", photos: [M(0), M(1), M(2)], languages: ["Français", "Anglais"], firstLanguage: "français", tagline: "Trail, fromage, et un peu de code", bio: "Développeur lyonnais, fan de montagne. Je cherche quelqu'un pour partager bivouacs et apéros. Je fais la vaisselle, promis." },
  { slug: "t03", name: "Inès", age: 31, gender: "woman", seeking: "man", city: "Marseille", occupation: "Architecte", lookingFor: "Mariage", photos: [W(3), W(4), W(5)], languages: ["Espagnol", "Français"], firstLanguage: "espagnol", tagline: "Espagnole de Marseille, accro au soleil", bio: "Arrivée de Séville il y a huit ans. J'aime la mer, les marchés et les longues discussions. Je cherche une relation stable et sincère." },
  { slug: "t04", name: "Thomas", age: 34, gender: "man", seeking: "woman", city: "Bordeaux", occupation: "Chef de cuisine", lookingFor: "Relation sérieuse", photos: [M(3), M(4)], languages: ["Français"], firstLanguage: "français", tagline: "Je cuisine mieux que je n'écris", bio: "Chef dans un petit restaurant de Bordeaux. Horaires décalés, mais toujours partant pour un verre en terrasse.", extra: { bio: "Chef dans un petit restaurant de Bordeaux." } },
  { slug: "t05", name: "Nadia", age: 38, gender: "woman", seeking: "man", city: "Lille", occupation: "Infirmière", lookingFor: "Mariage", photos: [W(6), W(7)], languages: ["Arabe", "Français"], firstLanguage: "arabe", tagline: "Le calme, la famille, les grandes tablées", bio: "Infirmière de nuit, je dors le jour et je vis la nuit.", extra: { bio: "Infirmière, je cherche du sérieux." } },
  { slug: "t06", name: "Karim", age: 41, gender: "man", seeking: "woman", city: "Toulouse", occupation: "Ingénieur", lookingFor: "Relation sérieuse", photos: [M(5), M(6), M(7)], languages: ["Français", "Arabe"], firstLanguage: "français", tagline: "Rugby le samedi, lecture le dimanche", bio: "Ingénieur à Toulouse. Papa d'un garçon de 9 ans une semaine sur deux. J'aime le rugby, les bouquins et les dimanches tranquilles." },
  { slug: "t07", name: "Élise", age: 45, gender: "woman", seeking: "man", city: "Nantes", occupation: "Professeure", lookingFor: "Relation amoureuse", photos: [W(8), W(9), W(10)], languages: ["Français"], firstLanguage: "français", tagline: "Prof le jour, randonneuse le week-end", bio: "Professeure de lettres à Nantes. Deux grands enfants partis, une maison à remplir de rires et de projets." },
  { slug: "t08", name: "Marc", age: 48, gender: "man", seeking: "woman", city: "Strasbourg", occupation: "Artisan", lookingFor: "Mariage", photos: [M(1), M(3), M(5)], languages: ["Français", "Allemand"], firstLanguage: "français", tagline: "Bois, vin chaud et frontière", bio: "Artisan ébéniste. Je travaille le bois et je parle allemand au marché de Noël.", extra: { weightKg: undefined, hairColor: undefined, annualIncome: undefined } },
  { slug: "t09", name: "Sofia", age: 52, gender: "woman", seeking: "man", city: "Nice", occupation: "Pharmacienne", lookingFor: "Relation sérieuse", photos: [W(11), W(12), W(13)], languages: ["Portugais", "Français"], firstLanguage: "portugais", tagline: "Le soleil, la mer, et un bon livre", bio: "Pharmacienne niçoise d'origine portugaise. J'aime les marchés, la mer tôt le matin et les repas qui durent." },
  { slug: "t10", name: "Patrick", age: 57, gender: "man", seeking: "woman", city: "Marseille", occupation: "Ancien commercial", lookingFor: "Relation amoureuse", photos: [M(4)], languages: ["Français"], firstLanguage: "français", tagline: "Retraité, vélo et pastis", bio: "Retraité depuis deux ans.", extra: { bio: "Retraité depuis deux ans. Vélo le matin, pétanque le soir." } },
  { slug: "t11", name: "Monique", age: 63, gender: "woman", seeking: "man", city: "Lyon", occupation: "Retraitée", lookingFor: "Relation amoureuse", photos: [W(0), W(7), W(9)], languages: ["Français"], firstLanguage: "français", tagline: "Jardin, théâtre, petits-enfants", bio: "Retraitée lyonnaise. Jardin, théâtre, et mes petits-enfants le mercredi. J'aimerais partager des sorties et des voyages." },
  { slug: "t12", name: "André", age: 66, gender: "man", seeking: "woman", city: "Toulouse", occupation: "Retraité", lookingFor: "Mariage", photos: [M(7), M(2)], languages: ["Français"], firstLanguage: "français", tagline: "Le Sud, la guitare et les marchés", bio: "Retraité toulousain. Je joue de la guitare et je cuisine pour ceux que j'aime." },
  { slug: "t13", name: "Léa", age: 22, gender: "woman", seeking: "woman", city: "Paris", occupation: "Étudiante", lookingFor: "Relation amoureuse", photos: [W(2), W(5), W(12)], languages: ["Français", "Anglais"], firstLanguage: "français", tagline: "Cinéma, ramen et expos gratuites", bio: "Étudiante en cinéma à Paris. Je cherche quelqu'un pour partager des séances de minuit et des ramen à midi." },
  { slug: "t14", name: "Yann", age: 29, gender: "man", seeking: "man", city: "Nantes", occupation: "Sage-femme", lookingFor: "Relation sérieuse", photos: [M(2), M(6), M(0)], languages: ["Français"], firstLanguage: "français", tagline: "Sage-femme, vélo, bord de Loire", bio: "Sage-femme à Nantes. Balades à vélo, concerts et cuisine du dimanche. Je cherche une relation stable." },
  { slug: "t15", name: "Amina", age: 36, gender: "woman", seeking: "man", city: "Bordeaux", occupation: "Comptable", lookingFor: "Mariage", photos: [W(6), W(10), W(3)], languages: ["Arabe", "Français", "Anglais"], firstLanguage: "arabe", tagline: "Bordeaux, la famille, les voyages", bio: "Comptable à Bordeaux. J'aime les voyages, la famille et les projets à deux. Je cherche une relation sérieuse." },
];

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
console.log(`Supabase   : project ${projectRef} (${url})`);
console.log(`Mode       : ${APPLY ? "APPLY (writes)" : "dry-run"}`);
console.log(`Personas   : ${PERSONAS.length}\n`);

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
    ...(p.extra ?? {}),
    id: `u:${user.id}`,
    photos: p.photos,
    photo: p.photos[0],
    joinedAt: now,
    lastActive: now,
    compatibility: 0,
    testAccount: true,
    testBatch: BATCH,
    profileHidden: true,
  };
  delete data.extra;
  const { error: upErr } = await sb.from("swivv_profiles").upsert({ user_id: user.id, data, updated_at: now });
  if (upErr) throw upErr;
  manifest.push({ id: p.slug, userId: user.id, displayName: p.name, age: p.age, city: p.city, email, password, batch: BATCH, hidden: true });
  console.log(`[ok]   ${p.slug} ${p.name} -> u:${user.id}`);
}

if (APPLY) {
  const dir = join(process.cwd(), "secrets");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, `test-credentials-${BATCH}.json`);
  writeFileSync(file, JSON.stringify({ batch: BATCH, project: projectRef, createdAt: now, accounts: manifest }, null, 2), { mode: 0o600 });
  console.log(`\nManifest: ${file} (${manifest.length} accounts, git-ignored, no passwords printed)`);
  console.log(`Cleanup : delete from public.swivv_profiles where data->>'testBatch' = '${BATCH}';`);
} else {
  console.log("\nNothing written. Re-run with SWIVV_TEST_SEED=1 and --apply to seed.");
}

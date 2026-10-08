// Generates a Web Push (VAPID) key pair and prints the values to paste
// into .env. Requires Node.js 16+ (uses node:crypto).
import { generateKeyPairSync } from "node:crypto";

const kp = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
const pubJwk = kp.publicKey.export({ format: "jwk" });
const rawPub = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(pubJwk.x, "base64url"),
  Buffer.from(pubJwk.y, "base64url"),
]);
const privPkcs8 = kp.privateKey.export({ format: "der", type: "pkcs8" });

console.log("VAPID_PUBLIC_KEY=" + rawPub.toString("base64url"));
console.log("VAPID_PRIVATE_KEY=" + privPkcs8.toString("base64url"));
console.log("VITE_VAPID_PUBLIC_KEY=" + rawPub.toString("base64url"));
console.log("\nAdd these to .env (and to your Cloudflare Worker env vars in production).");

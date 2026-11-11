export const SITE_URL = "https://swivvmatch.com";
export const OG_IMAGE = `${SITE_URL}/swivv-match-logo.jpg`;

// ponytail: path list duplicated in public/robots.txt — update both if a private route is added
export const PRIVATE_PATH =
  /^\/(admin|browse|member|messagerie|matches|mon-profil|notifications|parametres|progress|recherche-avancee|statistiques|swipe|verification|facturation|emails|moderation|temoignage|simulation-erreur|api)(\/|$)/;

export function pageHead(title: string, description: string, path: string, type = "website") {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:type", content: type },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function ldJson(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

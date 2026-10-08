import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, Search } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { BLOG_POSTS, getBannerStyle, getCategories } from "@/lib/blog-data";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title: "Blog rencontres — SWIVV" }] }),
  component: BlogPage,
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function BlogPage() {
  const [filter, setFilter] = useState<string>("Tout");
  const [search, setSearch] = useState("");
  const categories = ["Tout", ...getCategories()];

  let posts = BLOG_POSTS;
  if (filter !== "Tout") posts = posts.filter((p) => p.category === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }

  const featured = filter === "Tout" && !search ? posts[0] : null;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo /></Link>
          <span className="text-sm text-[#777]">Le blog des rencontres</span>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />

      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-[#555]">
          <ArrowLeft className="h-4 w-4" /> Accueil
        </Link>

        <h1 className="text-3xl font-medium text-[#333]">Le blog SWIVV</h1>
        <p className="mt-2 text-[#777]">
          Conseils rencontres, mariage, idées de sorties et témoignages de couples.
        </p>

        <div className="relative mb-4 mt-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#999]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article…"
            aria-label="Rechercher un article"
            className="w-full rounded-md border border-border bg-white py-2.5 pl-9 pr-3 text-[15px] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#e91e63]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setFilter(c)}
              aria-pressed={filter === c}
              className={`rounded-full px-3 py-1 text-sm ${
                filter === c ? "bg-[#e91e63] text-white" : "bg-[#f2f2f2] text-[#555]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {featured && (
          <Link to="/blog/$slug" params={{ slug: featured.slug }} className="mt-6 block overflow-hidden rounded-xl bg-white">
            <img src={featured.thumbnail} alt={featured.title} style={getBannerStyle(featured.slug)} className="aspect-[16/8] w-full object-cover object-center" />
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#e91e63]">{featured.category}</p>
              <h2 className="mt-1 text-2xl font-medium text-[#333]">{featured.title}</h2>
              <p className="mt-2 text-sm text-[#777]">{featured.excerpt}</p>
              <p className="mt-3 text-xs text-[#999]">
                {featured.author} · {formatDate(featured.date)} · {featured.readTime}
              </p>
            </div>
          </Link>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {rest.map((p) => (
            <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="group overflow-hidden rounded-xl bg-white">
              <div className="aspect-[16/9] overflow-hidden">
                <img
                  src={p.thumbnail}
                  alt={p.title}
                  loading="lazy"
                  style={getBannerStyle(p.slug)}
                  className="h-full w-full object-cover object-center transition group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#e91e63]">{p.category}</p>
                <h3 className="mt-1 font-medium leading-snug text-[#333] group-hover:text-[#e91e63]">
                  {p.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-[#777]">{p.excerpt}</p>
                <p className="mt-2 flex items-center gap-1 text-xs text-[#999]">
                  <Clock className="h-3.5 w-3.5" /> {p.readTime} · {formatDate(p.date)}
                </p>
              </div>
            </Link>
          ))}
        </div>
        {rest.length === 0 && !featured && (
          <p className="mt-6 text-sm text-[#777]">Aucun article trouvé.</p>
        )}
      </div>
      <SwivvFooter />
    </div>
  );
}

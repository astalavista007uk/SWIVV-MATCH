import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Clock, ChevronRight, Heart, Share2, Check } from "lucide-react";
import { SwivvLogo } from "@/components/swivv-logo";
import { SwivvAuthButtons, useSwivvUser } from "@/lib/swivv-auth";
import { SwivvCategoryNav } from "@/components/swivv-category-nav";
import { SwivvFooter } from "@/components/swivv-footer";
import { getBannerStyle, getPostBySlug, getRelatedPosts } from "@/lib/blog-data";
import { useDateLocale, useT } from "@/lib/i18n";
import { ldJson, OG_IMAGE, pageHead, SITE_URL } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  head: ({ params }) => {
    const post = getPostBySlug(params.slug);
    if (!post) return { meta: [{ title: "Blog — SWIVV MATCH" }] };
    const url = `${SITE_URL}/blog/${post.slug}`;
    const base = pageHead(
      `${post.title} — Blog SWIVV MATCH`,
      post.excerpt,
      `/blog/${post.slug}`,
      "article",
    );
    return {
      meta: [
        ...base.meta,
        { property: "og:image", content: OG_IMAGE },
        { property: "article:published_time", content: post.date },
      ],
      links: base.links,
      scripts: [
        ldJson({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "BlogPosting",
              headline: post.title,
              description: post.excerpt,
              datePublished: post.date,
              dateModified: post.date,
              inLanguage: "fr-FR",
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
              // ponytail: raster article image (the built-in thumbnails are SVG, which many crawlers reject) — swap for per-post JPGs when available
              image: OG_IMAGE,
              author: { "@type": "Organization", name: "Équipe SWIVV" },
              publisher: {
                "@type": "Organization",
                name: "SWIVV MATCH",
                logo: {
                  "@type": "ImageObject",
                  url: `${SITE_URL}/swivv-match-logo-transparent.png`,
                },
              },
            },
            {
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Blog", item: `${SITE_URL}/blog` },
                { "@type": "ListItem", position: 2, name: post.title, item: url },
              ],
            },
          ],
        }),
      ],
    };
  },
  loader: ({ params }) => {
    if (!getPostBySlug(params.slug)) throw notFound();
  },
  component: BlogPostPage,
});

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

function BlogPostPage() {
  const t = useT();
  const dateLocale = useDateLocale();
  const { slug } = Route.useParams();
  const post = getPostBySlug(slug);
  const user = useSwivvUser();
  const [copied, setCopied] = useState(false);

  // ponytail: native share sheet first (mobile), clipboard fallback (desktop) — no third-party SDKs; per-network buttons if analytics ever needs the channel
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: t(post?.title ?? "Blog SWIVV"), text: post?.excerpt ? t(post.excerpt) : undefined, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!post) return null;

  const related = getRelatedPosts(slug, 3);
  const bannerStyle = getBannerStyle(slug);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-black text-white">
        <div className="mx-auto flex flex-wrap max-w-6xl items-center gap-3 px-4 py-2 sm:py-1">
          <Link to="/" aria-label="SWIVV MATCH home"><SwivvLogo dark /></Link>
          <SwivvAuthButtons />
        </div>
      </header>
      <SwivvCategoryNav />
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-1 text-sm text-[#5c5c66]">
          <Link to="/blog" className="hover:text-[#e60050]">Blog</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-[#333]">{t(post.category)}</span>
        </div>

        {/* Header */}
        <span className="mb-2 inline-block w-fit rounded-full bg-[#e60050]/10 px-2.5 py-0.5 text-xs font-semibold text-[#e60050]">{t(post.category)}</span>
        <h1 className="text-3xl font-medium leading-tight">{t(post.title)}</h1>
        <div className="mt-3 flex items-center gap-4 text-sm text-[#5c5c66]">
          <span className="flex items-center gap-1.5">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-[#e60050]/10">
              <Heart className="h-3.5 w-3.5 text-[#e60050]" />
            </div>
            {t(post.author)}
          </span>
          <span>{formatDate(post.date, dateLocale)}</span>
          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {t(post.readTime)}</span>
        </div>

        {/* Cover image (hidden on témoignages unless it's an SVG banner illustration).
            SVG illustrations render as a wide, thin banner; photos keep 16/9. */}
        {(post.thumbnail.endsWith(".svg") || !post.testimonials) &&
          (post.thumbnail.endsWith(".svg") ? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm">
              <img src={post.thumbnail} alt={t(post.title)} style={bannerStyle} className="h-44 w-full object-cover sm:h-56" />
            </div>
          ) : (
            <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-muted">
              <img src={post.thumbnail} alt={t(post.title)} className="h-full w-full object-cover object-center" />
            </div>
          ))}

        {/* Content */}
        {post.testimonials ? (
          <div className="mt-8 space-y-4">
            <p className="text-[15px] leading-relaxed text-foreground/90">{t(post.content[0])}</p>
            <div className="grid gap-6 !pt-2">
              {post.testimonials.map((tm, i) => (
                <figure
                  key={tm.names}
                  className="rounded-2xl border-2 border-[#e60050]/15 bg-white shadow-sm"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#e60050] px-2.5 py-0.5 text-xs font-medium text-white">
                        {t("Témoignage {n}", { n: i + 1 })}
                      </span>
                      <span className="text-xs text-[#6b6b73]">{tm.place}</span>
                    </div>
                    <blockquote className="mt-3 leading-relaxed text-[#333]">« {tm.quote} »</blockquote>
                    <figcaption className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#e60050]">
                      <Heart className="h-4 w-4 fill-[#e60050] text-[#e60050]" /> {tm.names}
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
            {post.content.slice(1).map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-foreground/90">{t(para)}</p>
            ))}
            <Link
              to="/temoignage"
              className="inline-block rounded-md bg-[#e60050] px-5 py-3 font-medium text-white"
            >
              {t("Partager notre témoignage")}
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {post.content.map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-foreground/90">{t(para)}</p>
            ))}
          </div>
        )}

        {/* Signup CTA (logged-out only — one shared banner, no per-article copy) */}
        {!user && (
          <div className="mt-8 rounded-2xl bg-[#e60050] p-6 text-center text-white">
            <p className="text-lg font-semibold">{t("Trouve ton Swivv")}</p>
            <p className="mt-1 text-sm text-white/85">{t("Inscription gratuite, sans carte bancaire.")}</p>
            <Link to="/inscription" className="mt-4 inline-block rounded-md bg-white px-6 py-2.5 font-medium text-[#e60050]">
              {t("Créer mon profil gratuit")}
            </Link>
          </div>
        )}

        {/* Share / back */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-[#e60050]">
            <ArrowLeft className="h-4 w-4" /> {t("Tous les articles")}
          </Link>
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3.5 py-1.5 text-sm font-medium text-[#555] hover:text-[#e60050]"
          >
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
            {copied ? t("Lien copié !") : t("Partager")}
          </button>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-medium text-[#333]">{t("Articles similaires")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group overflow-hidden rounded-xl bg-white transition hover:shadow-sm"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-[#f2f2f2]">
                    <img src={r.thumbnail} alt={t(r.title)} loading="lazy" style={getBannerStyle(r.slug)} className="h-full w-full object-cover object-center transition group-hover:scale-105" />
                  </div>
                  <div className="p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[#e60050]">{t(r.category)}</div>
                    <div className="mt-0.5 line-clamp-2 text-xs font-semibold leading-tight group-hover:text-[#e60050]">{t(r.title)}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
      <SwivvFooter />
    </div>
  );
}

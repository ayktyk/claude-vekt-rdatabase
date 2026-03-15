import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSeo } from "@/hooks/use-seo";
import { formatDateTr } from "@/lib/format-date";
import { getLegalUpdateBySlug } from "@/lib/legal-updates-repository";
import type { LegalUpdate } from "@/types/legal-update";

const LegalUpdatePost = () => {
  const { slug = "" } = useParams();
  const [item, setItem] = useState<LegalUpdate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadItem = async () => {
      const result = await getLegalUpdateBySlug(slug);
      if (mounted) {
        setItem(result);
        setLoading(false);
      }
    };

    void loadItem();

    return () => {
      mounted = false;
    };
  }, [slug]);

  useSeo({
    title: item?.seoTitle ?? `${item?.title ?? "Gündem"} | Vega Hukuk`,
    description: item?.seoDescription ?? item?.excerpt ?? "Güncel hukuk gelişmeleri ve karar notları.",
    canonicalPath: `/guncel-hukuk-gundemi/${slug}`,
    image: item?.coverImage,
    type: "article",
    structuredData: item
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: item.title,
            description: item.seoDescription ?? item.excerpt,
            datePublished: item.publishedAt,
            dateModified: item.updatedAt ?? item.publishedAt,
            publisher: {
              "@type": "LegalService",
              name: "Vega Hukuk",
              url: window.location.origin,
            },
            image: item.coverImage
              ? `${window.location.origin}${item.coverImage}`
              : `${window.location.origin}/og-image.svg`,
            mainEntityOfPage: `${window.location.origin}/guncel-hukuk-gundemi/${item.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Ana Sayfa", item: window.location.origin },
              { "@type": "ListItem", position: 2, name: "Güncel Hukuk Gündemi", item: `${window.location.origin}/guncel-hukuk-gundemi` },
              { "@type": "ListItem", position: 3, name: item.title },
            ],
          },
        ]
      : undefined,
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <section className="section-container py-24">
          <p className="text-muted-foreground">İçerik yükleniyor...</p>
        </section>
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-background">
        <section className="section-container py-24">
          <h1 className="font-display text-4xl font-bold text-primary-deep">İçerik bulunamadı</h1>
          <p className="mt-3 text-muted-foreground">İlgili hukuk gündemi içeriği kaldırılmış olabilir veya bağlantı yanlış olabilir.</p>
          <Link to="/guncel-hukuk-gundemi" className="mt-6 inline-flex items-center gap-2 font-semibold text-primary">
            <ArrowLeft className="h-4 w-4" /> Gündem listesine dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <article className="section-container max-w-[900px] pt-24 pb-16">
        <Link
          to="/guncel-hukuk-gundemi"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Gündem listesine dön
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[1.4px] text-accent">
            {item.category}
          </span>
          <h1 className="mt-3 font-display text-[clamp(34px,5vw,56px)] font-bold leading-[1.1] text-primary-deep">
            {item.title}
          </h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <span>{formatDateTr(item.publishedAt)}</span>
          </div>
        </div>

        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="mt-8 mb-9 aspect-[16/8] w-full rounded-2xl object-cover"
            loading="eager"
          />
        ) : (
          <div
            className={`mt-8 mb-9 aspect-[16/8] w-full rounded-2xl bg-gradient-to-br ${
              item.coverClass ?? "from-primary/[0.08] to-primary/[0.03]"
            }`}
          />
        )}

        <div className="space-y-5 text-[17px] leading-[1.85] text-foreground/90">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node, ...props }) => <h2 className="mt-10 font-display text-3xl font-bold text-primary-deep" {...props} />,
              h3: ({ node, ...props }) => <h3 className="mt-8 font-display text-2xl font-bold text-primary-deep" {...props} />,
              p: ({ node, ...props }) => <p className="mt-5" {...props} />,
              ul: ({ node, ...props }) => <ul className="mt-5 list-disc space-y-2 pl-6" {...props} />,
              ol: ({ node, ...props }) => <ol className="mt-5 list-decimal space-y-2 pl-6" {...props} />,
              li: ({ node, ...props }) => <li className="pl-1" {...props} />,
            }}
          >
            {item.content}
          </ReactMarkdown>
        </div>
      </article>
    </main>
  );
};

export default LegalUpdatePost;

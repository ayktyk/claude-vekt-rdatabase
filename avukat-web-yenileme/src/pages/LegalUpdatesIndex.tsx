import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { formatDateTr } from "@/lib/format-date";
import { listLegalUpdates } from "@/lib/legal-updates-repository";
import type { LegalUpdate } from "@/types/legal-update";

const LegalUpdatesIndex = () => {
  const [items, setItems] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: "Güncel Hukuk Gündemi | Vega Hukuk",
    description: "Önemli Yargıtay kararları, güncel hukuk haberleri ve uygulamaya dönük kısa değerlendirmeler.",
    canonicalPath: "/guncel-hukuk-gundemi",
  });

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      const result = await listLegalUpdates();
      if (mounted) {
        setItems(result);
        setLoading(false);
      }
    };

    void loadItems();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="section-container pt-24 pb-6">
        <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          Ana sayfaya dön
        </Link>
        <h1 className="mt-4 font-display text-[clamp(34px,5vw,54px)] font-bold leading-[1.1] text-primary-deep">
          Güncel Hukuk Gündemi
        </h1>
        <p className="mt-3 max-w-[70ch] text-base text-muted-foreground">
          Güncel hukuk haberleri, önemli karar notları ve uygulamaya dönük kısa içerikler burada yayınlanır.
        </p>
      </section>

      <section className="section-container pb-16">
        {loading ? (
          <p className="text-muted-foreground">Gündem yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {items.map((item) => (
              <article
                key={item.slug}
                className="rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-elegant-lg"
              >
                {item.coverImage ? (
                  <img
                    src={item.coverImage}
                    alt={item.title}
                    className="mb-5 aspect-[16/8] w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`mb-5 aspect-[16/8] w-full rounded-xl bg-gradient-to-br ${
                      item.coverClass ?? "from-primary/[0.08] to-primary/[0.03]"
                    }`}
                  />
                )}
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTr(item.publishedAt)}
                </div>
                <Link to={`/guncel-hukuk-gundemi/${item.slug}`} className="block">
                  <h2 className="font-display text-[28px] font-bold leading-[1.2] text-primary-deep transition-colors hover:text-primary">{item.title}</h2>
                </Link>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{item.excerpt}</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[1.3px] text-accent">{item.category}</span>
                </div>
                <Link
                  to={`/guncel-hukuk-gundemi/${item.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
                >
                  Devamını oku <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default LegalUpdatesIndex;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Scale } from "lucide-react";
import { listLatestLegalUpdates } from "@/lib/legal-updates-repository";
import { formatDateTr } from "@/lib/format-date";
import type { LegalUpdate } from "@/types/legal-update";

const LegalUpdatesSection = () => {
  const [items, setItems] = useState<LegalUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadItems = async () => {
      const result = await listLatestLegalUpdates(3);
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
    <section id="hukuk-gundemi" className="bg-cream py-20">
      <div className="section-container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[2.5px] text-accent before:h-[1.5px] before:w-6 before:bg-accent before:content-['']"
            >
              Gündem
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-3 font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep"
            >
              Güncel Hukuk Gündemi
            </motion.h3>
            <p className="mt-3 max-w-[70ch] text-base text-muted-foreground">
              Güncel hukuki gelişmeleri, önemli Yargıtay kararlarını ve uygulamaya dönük kısa notları panelden ekleyip
              burada yayınlayabilirsin.
            </p>
          </div>
          <Link
            to="/guncel-hukuk-gundemi"
            className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-pale px-4 py-2 text-[13px] font-semibold text-primary-deep transition-all hover:bg-accent/20"
          >
            <Scale className="h-3.5 w-3.5" /> Tümünü Gör
          </Link>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Gündem yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {items.map((item, index) => (
              <motion.article
                key={item.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
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
                  <h4 className="font-display text-2xl font-bold text-primary-deep transition-colors hover:text-primary">{item.title}</h4>
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
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default LegalUpdatesSection;

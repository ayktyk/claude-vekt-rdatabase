import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { listLatestBlogPosts } from "@/lib/blog-repository";
import { formatDateTr } from "@/lib/format-date";
import type { BlogPost } from "@/types/blog";

const ArticlesSection = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      const result = await listLatestBlogPosts(3);
      if (mounted) {
        setPosts(result);
        setLoading(false);
      }
    };

    void loadPosts();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section id="yayinlar" className="bg-background py-20">
      <div className="section-container">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[2.5px] text-accent before:h-[1.5px] before:w-6 before:bg-accent before:content-['']"
            >
              Blog
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="mt-3 font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep"
            >
              Yayınlar ve İçgörüler
            </motion.h3>
          </div>
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent-pale px-4 py-2 text-[13px] font-semibold text-primary-deep transition-all hover:bg-accent/20"
            >
              <Newspaper className="h-3.5 w-3.5" /> Tümünü Gör
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Yazılar yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {posts.map((post, i) => (
              <motion.article
                key={post.slug}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-7 transition-all duration-400 hover:-translate-y-1 hover:border-accent/25 hover:shadow-elegant-lg"
              >
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="mb-4 aspect-video w-full rounded-[10px] object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`relative mb-4 flex aspect-video w-full items-center justify-center overflow-hidden rounded-[10px] bg-gradient-to-br ${
                      post.coverClass ?? "from-primary/[0.08] to-primary/[0.03]"
                    }`}
                  />
                )}
                <span className="mb-3 inline-block text-[11px] font-bold uppercase tracking-[1.5px] text-accent">
                  {post.category}
                </span>
                <Link to={`/blog/${post.slug}`} className="block">
                  <h4 className="mb-2 font-display text-xl font-bold text-primary-deep transition-colors hover:text-primary">{post.title}</h4>
                </Link>
                <p className="text-[14.5px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTr(post.publishedAt)}
                </div>
                <div>
                  <Link
                    to={`/blog/${post.slug}`}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3"
                  >
                    Devamını oku <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ArticlesSection;

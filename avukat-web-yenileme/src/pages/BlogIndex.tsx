import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays } from "lucide-react";
import { useSeo } from "@/hooks/use-seo";
import { formatDateTr } from "@/lib/format-date";
import { listBlogPosts } from "@/lib/blog-repository";
import type { BlogPost } from "@/types/blog";

const BlogIndex = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useSeo({
    title: "Blog | Vega Hukuk",
    description: "Vega Hukuk blog yazıları: iş hukuku, icra, kira ve güncel hukuki değerlendirmeler.",
    canonicalPath: "/blog",
  });

  useEffect(() => {
    let mounted = true;

    const loadPosts = async () => {
      const result = await listBlogPosts();
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
    <main className="min-h-screen bg-background">
      <section className="section-container pt-24 pb-6">
        <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          Ana sayfaya dön
        </Link>
        <h1 className="mt-4 font-display text-[clamp(34px,5vw,54px)] font-bold leading-[1.1] text-primary-deep">
          Blog Yazıları
        </h1>
        <p className="mt-3 max-w-[70ch] text-base text-muted-foreground">
          Haftalık yayınlanan hukuki içeriklerimizle dava süreci, risk yönetimi ve uygulamaya dönük pratik notları
          paylaşıyoruz.
        </p>
      </section>

      <section className="section-container pb-16">
        {loading ? (
          <p className="text-muted-foreground">Yazılar yükleniyor...</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-accent/25 hover:shadow-elegant-lg"
              >
                {post.coverImage ? (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="mb-5 aspect-[16/8] w-full rounded-xl object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    className={`mb-5 aspect-[16/8] w-full rounded-xl bg-gradient-to-br ${
                      post.coverClass ?? "from-primary/[0.08] to-primary/[0.03]"
                    }`}
                  />
                )}
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatDateTr(post.publishedAt)}
                </div>
                <Link to={`/blog/${post.slug}`} className="block">
                  <h2 className="font-display text-[28px] font-bold leading-[1.2] text-primary-deep transition-colors hover:text-primary">{post.title}</h2>
                </Link>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[1.3px] text-accent">{post.category}</span>
                  <span className="text-border">&middot;</span>
                  <span className="text-xs text-muted-foreground">{post.author}</span>
                </div>
                <Link
                  to={`/blog/${post.slug}`}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-all hover:gap-2.5"
                >
                  Yazıyı oku <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default BlogIndex;

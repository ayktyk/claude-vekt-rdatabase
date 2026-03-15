import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getBlogPostBySlug, listBlogPosts, resetBlogRepositoryCache } from "@/lib/blog-repository";

describe("blog repository", () => {
  beforeEach(() => {
    resetBlogRepositoryCache();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    resetBlogRepositoryCache();
    vi.unstubAllEnvs();
  });

  it("returns local markdown posts sorted by publication date", async () => {
    vi.stubEnv("VITE_BLOG_API_URL", "");

    const posts = await listBlogPosts();

    expect(posts).toHaveLength(5);
    expect(posts.map((post) => post.slug)).toContain("ise-iade-arabuluculukta-kritik-noktalar");
    expect(posts.map((post) => post.slug)).toContain("menfi-tespit-davasinda-ispat-yuku");
    expect(posts.map((post) => post.slug)).toContain("kira-uyarlama-davasi-yol-haritasi");
    expect(posts.find((post) => post.slug === "ise-iade-arabuluculukta-kritik-noktalar")?.content).toContain(
      "Arabuluculuk başvurusu",
    );
  });

  it("maps nested CMS payloads with env-based field paths", async () => {
    vi.stubEnv("VITE_BLOG_API_URL", "https://cms.example.test/posts");
    vi.stubEnv("VITE_BLOG_ITEMS_PATH", "data.items");
    vi.stubEnv("VITE_BLOG_FIELD_SLUG", "fields.slug");
    vi.stubEnv("VITE_BLOG_FIELD_TITLE", "fields.title");
    vi.stubEnv("VITE_BLOG_FIELD_EXCERPT", "fields.summary");
    vi.stubEnv("VITE_BLOG_FIELD_CONTENT", "fields.body");
    vi.stubEnv("VITE_BLOG_FIELD_CATEGORY", "fields.category");
    vi.stubEnv("VITE_BLOG_FIELD_AUTHOR", "fields.author.name");
    vi.stubEnv("VITE_BLOG_FIELD_PUBLISHED_AT", "fields.publishDate");
    vi.stubEnv("VITE_BLOG_FIELD_UPDATED_AT", "fields.updatedDate");
    vi.stubEnv("VITE_BLOG_FIELD_SEO_TITLE", "fields.seo.title");
    vi.stubEnv("VITE_BLOG_FIELD_SEO_DESCRIPTION", "fields.seo.description");
    vi.stubEnv("VITE_BLOG_FIELD_COVER_IMAGE", "fields.cover.url");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            items: [
              {
                fields: {
                  slug: "cms-uyumlu-yazi",
                  title: "CMS Uyumlu Yazı",
                  summary: "Özet metni",
                  body: "Birinci paragraf\n\nİkinci paragraf",
                  category: "Blog",
                  author: { name: "Editör" },
                  publishDate: "2026-03-08",
                  updatedDate: "2026-03-09",
                  seo: {
                    title: "CMS SEO Başlık",
                    description: "CMS SEO Açıklama",
                  },
                  cover: { url: "/images/cms-cover.jpg" },
                },
              },
            ],
          },
        }),
      }),
    );

    const posts = await listBlogPosts();

    expect(posts).toHaveLength(1);
    expect(posts[0]).toMatchObject({
      slug: "cms-uyumlu-yazi",
      title: "CMS Uyumlu Yazı",
      excerpt: "Özet metni",
      category: "Blog",
      author: "Editör",
      publishedAt: "2026-03-08",
      updatedAt: "2026-03-09",
      seoTitle: "CMS SEO Başlık",
      seoDescription: "CMS SEO Açıklama",
      coverImage: "/images/cms-cover.jpg",
    });
    expect(posts[0]?.content).toContain("İkinci paragraf");
  });

  it("falls back to local markdown posts when remote API fails", async () => {
    vi.stubEnv("VITE_BLOG_API_URL", "https://cms.example.test/posts");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }),
    );

    const posts = await listBlogPosts();

    expect(posts).toHaveLength(5);
    expect(posts[0]?.slug).toBe("nitelikli-dolandiricilik-iban-kullandirma-yargitay-kararlari");
  });

  it("finds a post by slug", async () => {
    const post = await getBlogPostBySlug("menfi-tespit-davasinda-ispat-yuku");

    expect(post?.title).toBe("Menfi Tespit Davasında İspat Yükü");
  });
});

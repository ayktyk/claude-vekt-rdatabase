import { parseMarkdownDocument } from "@/lib/markdown-frontmatter";
import type { LegalUpdate } from "@/types/legal-update";

type MarkdownModuleMap = Record<string, string>;
type LegalUpdateFrontmatter = Partial<LegalUpdate> & { slug?: string };

const markdownModules = import.meta.glob("../content/legal-updates/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
}) as MarkdownModuleMap;

let updatesPromise: Promise<LegalUpdate[]> | null = null;

const sortByDateDesc = (items: LegalUpdate[]) =>
  [...items].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return undefined;
};

const toSlugFromPath = (path: string) => path.split("/").pop()?.replace(/\.md$/, "") ?? path;

const parseLegalUpdate = (path: string, raw: string): LegalUpdate | null => {
  const { data, content } = parseMarkdownDocument<LegalUpdateFrontmatter>(raw);
  const slug = toOptionalString(data.slug) || toSlugFromPath(path);
  const title = toOptionalString(data.title);
  const excerpt = toOptionalString(data.excerpt);
  const publishedAt = toOptionalString(data.publishedAt);

  if (!title || !excerpt || !publishedAt) {
    return null;
  }

  return {
    slug,
    title,
    excerpt,
    content,
    category: toOptionalString(data.category) || "Hukuk Gündemi",
    publishedAt,
    updatedAt: toOptionalString(data.updatedAt),
    seoTitle: toOptionalString(data.seoTitle),
    seoDescription: toOptionalString(data.seoDescription),
    coverClass: toOptionalString(data.coverClass),
    coverImage: toOptionalString(data.coverImage),
  };
};

const loadLocalUpdates = async (): Promise<LegalUpdate[]> =>
  sortByDateDesc(
    Object.entries(markdownModules)
      .map(([path, raw]) => parseLegalUpdate(path, raw))
      .filter((item): item is LegalUpdate => item !== null),
  );

export const listLegalUpdates = async (): Promise<LegalUpdate[]> => {
  if (!updatesPromise) {
    updatesPromise = loadLocalUpdates();
  }

  return updatesPromise;
};

export const listLatestLegalUpdates = async (limit = 3): Promise<LegalUpdate[]> => {
  const items = await listLegalUpdates();
  return items.slice(0, limit);
};

export const getLegalUpdateBySlug = async (slug: string): Promise<LegalUpdate | null> => {
  const items = await listLegalUpdates();
  return items.find((item) => item.slug === slug) ?? null;
};

export const resetLegalUpdatesRepositoryCache = () => {
  updatesPromise = null;
};

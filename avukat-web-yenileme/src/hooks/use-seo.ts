import { useEffect } from "react";

type SeoStructuredData = Record<string, unknown> | Array<Record<string, unknown>>;

type SeoOptions = {
  title: string;
  description: string;
  canonicalPath: string;
  image?: string;
  type?: "website" | "article";
  structuredData?: SeoStructuredData;
};

const upsertMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
  let meta = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.content = content;
};

const upsertCanonical = (href: string) => {
  let link = document.head.querySelector("link[rel='canonical']") as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }

  link.href = href;
};

const upsertStructuredData = (data?: SeoStructuredData) => {
  const selector = "script[data-seo-structured-data='true']";
  const existing = document.head.querySelector(selector);

  if (!data) {
    existing?.remove();
    return;
  }

  const script = existing ?? document.createElement("script");
  script.setAttribute("type", "application/ld+json");
  script.setAttribute("data-seo-structured-data", "true");
  script.textContent = JSON.stringify(data);

  if (!existing) {
    document.head.appendChild(script);
  }
};

export const useSeo = ({ title, description, canonicalPath, image, type = "website", structuredData }: SeoOptions) => {
  useEffect(() => {
    const origin = window.location.origin;
    const canonical = `${origin}${canonicalPath}`;
    const imageUrl = image ? `${origin}${image}` : `${origin}/og-image.svg`;

    document.title = title;
    upsertCanonical(canonical);
    upsertMeta("meta[name='description']", "name", "description", description);
    upsertMeta("meta[property='og:title']", "property", "og:title", title);
    upsertMeta("meta[property='og:description']", "property", "og:description", description);
    upsertMeta("meta[property='og:type']", "property", "og:type", type);
    upsertMeta("meta[property='og:url']", "property", "og:url", canonical);
    upsertMeta("meta[property='og:image']", "property", "og:image", imageUrl);
    upsertMeta("meta[name='twitter:title']", "name", "twitter:title", title);
    upsertMeta("meta[name='twitter:description']", "name", "twitter:description", description);
    upsertMeta("meta[name='twitter:image']", "name", "twitter:image", imageUrl);
    upsertStructuredData(structuredData);
  }, [canonicalPath, description, image, structuredData, title, type]);
};

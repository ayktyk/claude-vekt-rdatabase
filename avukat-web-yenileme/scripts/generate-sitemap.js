import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const SITE = "https://vegahukukistanbul.com";
const today = new Date().toISOString().slice(0, 10);

const extractSlug = (filePath) => {
  const raw = readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const match = raw.match(/^slug:\s*"?([^"\n]+)"?\s*$/m);
  return match ? match[1].trim() : null;
};

const collectSlugs = (dir, prefix) => {
  const folder = join(root, "src", "content", dir);
  try {
    return readdirSync(folder)
      .filter((f) => f.endsWith(".md"))
      .map((f) => extractSlug(join(folder, f)))
      .filter(Boolean)
      .map((slug) => `${SITE}/${prefix}/${slug}`);
  } catch {
    return [];
  }
};

const staticPages = [
  { loc: `${SITE}/`, changefreq: "weekly", priority: "1.0" },
  { loc: `${SITE}/blog`, changefreq: "weekly", priority: "0.8" },
  { loc: `${SITE}/guncel-hukuk-gundemi`, changefreq: "daily", priority: "0.8" },
  { loc: `${SITE}/kvkk-aydinlatma`, changefreq: "monthly", priority: "0.3" },
  { loc: `${SITE}/cerez-politikasi`, changefreq: "monthly", priority: "0.3" },
  { loc: `${SITE}/hukuki-uyari`, changefreq: "monthly", priority: "0.3" },
];

const blogUrls = collectSlugs("blog", "blog").map((loc) => ({
  loc,
  changefreq: "monthly",
  priority: "0.7",
}));

const legalUrls = collectSlugs("legal-updates", "guncel-hukuk-gundemi").map((loc) => ({
  loc,
  changefreq: "monthly",
  priority: "0.7",
}));

const allPages = [...staticPages, ...blogUrls, ...legalUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

writeFileSync(join(root, "public", "sitemap.xml"), xml, "utf-8");
console.log(`Sitemap generated: ${allPages.length} URLs`);

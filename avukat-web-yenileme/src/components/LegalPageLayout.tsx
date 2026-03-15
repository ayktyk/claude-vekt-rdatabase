import { Link } from "react-router-dom";
import { useSeo } from "@/hooks/use-seo";

type LegalPageLayoutProps = {
  title: string;
  description: string;
  canonicalPath: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

const LegalPageLayout = ({ title, description, canonicalPath, sections }: LegalPageLayoutProps) => {
  useSeo({
    title: `${title} | Vega Hukuk`,
    description,
    canonicalPath,
  });

  return (
    <main className="min-h-screen bg-background">
      <section className="section-container max-w-[900px] pt-24 pb-16">
        <Link to="/" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          Ana sayfaya dön
        </Link>
        <h1 className="mt-4 font-display text-[clamp(34px,5vw,54px)] font-bold leading-[1.1] text-primary-deep">
          {title}
        </h1>
        <p className="mt-4 max-w-[70ch] text-base leading-relaxed text-muted-foreground">{description}</p>

        <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
          Bu sayfa yayın öncesi son hukuki metinle güncellenecek taslak iskelettir. Canlıya alma öncesinde nihai metin
          avukat tarafından gözden geçirilmelidir.
        </div>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.heading} className="space-y-3">
              <h2 className="font-display text-2xl font-bold text-primary-deep">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[16px] leading-8 text-foreground/90">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>
      </section>
    </main>
  );
};

export default LegalPageLayout;

import { Scale } from "lucide-react";
import { Link } from "react-router-dom";

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

const SiteFooter = () => {
  return (
    <footer className="relative bg-primary-deep pt-14 text-primary-foreground/60">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="section-container grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="mb-4 flex items-center gap-3.5">
            <div className="gradient-navy flex h-11 w-11 items-center justify-center rounded-md border border-primary-foreground/10 shadow-md">
              <Scale className="h-5 w-5 text-accent-light" />
            </div>
            <div>
              <strong className="block font-display text-lg text-primary-foreground">Vega Hukuk</strong>
              <small className="text-[11px] uppercase tracking-[2px] text-primary-foreground/35">
                Danışmanlık & Arabuluculuk
              </small>
            </div>
          </div>
          <p className="max-w-[38ch] text-sm leading-relaxed">
            Avukatlık Kanunu ve meslek kurallarına uygun olarak hizmet veririz. Bilgilendirme niteliğindedir; hukuki
            danışmanlık değildir.
          </p>
        </div>

        <div>
          <h5 className="mb-4 font-display text-base font-bold tracking-wide text-primary-foreground">Bağlantılar</h5>
          <ul className="space-y-2.5">
            {[
              { label: "Hakkımızda", href: "#hakkimizda" },
              { label: "Çalışma Alanları", href: "#calisma-alanlari" },
              { label: "Yayınlar", href: "#yayinlar" },
              { label: "Hukuk Gündemi", href: "#hukuk-gundemi" },
              { label: "İletişim", href: "#iletisim" },
            ].map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo(link.href);
                  }}
                  className="text-sm transition-colors hover:text-accent-light"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="mb-4 font-display text-base font-bold tracking-wide text-primary-foreground">Yasal</h5>
          <ul className="space-y-2.5">
            <li>
              <Link to="/kvkk-aydinlatma" className="text-sm transition-colors hover:text-accent-light">
                KVKK Aydınlatma Metni
              </Link>
            </li>
            <li>
              <Link to="/cerez-politikasi" className="text-sm transition-colors hover:text-accent-light">
                Çerez Politikası
              </Link>
            </li>
            <li>
              <Link to="/hukuki-uyari" className="text-sm transition-colors hover:text-accent-light">
                Hukuki Uyarı
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="section-container mt-10 border-t border-primary-foreground/[0.08] py-5 text-center text-[13px] text-primary-foreground/35">
        &copy; {new Date().getFullYear()} Vega Hukuk & Danışmanlık Arabuluculuk. Tüm hakları saklıdır.
      </div>
    </footer>
  );
};

export default SiteFooter;

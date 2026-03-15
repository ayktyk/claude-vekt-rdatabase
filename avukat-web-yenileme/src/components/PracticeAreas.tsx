import { motion } from "framer-motion";
import { Briefcase, Scale, Handshake, Home, Users, ShoppingCart, Gavel, FileSignature, Phone } from "lucide-react";

const areas = [
  { icon: Briefcase, title: "İş Hukuku", items: ["İşe iade • Kıdem/ihbar • Fazla mesai", "Mobbing • İş kazası tazminatı"] },
  { icon: Scale, title: "İcra & İflas", items: ["İtirazın iptali • Menfi tespit", "Takip ve tahsilat yönetimi"] },
  { icon: Handshake, title: "Ticaret & Sözleşmeler", items: ["Sözleşme tasarımı • Uyuşmazlık", "Şirketler hukuku danışmanlığı"] },
  { icon: Home, title: "Kira & Gayrimenkul", items: ["Kiraya uyarlama • Tahliye • Alacak", "Tapu iptal tescil • İzaleyi şuyu"] },
  { icon: Users, title: "Miras & Aile", items: ["Tereke • Tenkis • Mal rejimi", "Nafaka • Velayet • Vasi işlemleri"] },
  { icon: ShoppingCart, title: "Tüketici & Sigorta", items: ["Ayıplı mal/hizmet • Poliçe uyuşmazlığı", "Tazminat • Hakem heyeti süreçleri"] },
  { icon: Gavel, title: "Ceza Hukuku", items: ["Ceza davalarında savunma", "Soruşturma • Kovuşturma süreçleri"] },
  { icon: FileSignature, title: "Sözleşmeler Hukuku", items: ["Sözleşme tasarımı • Müzakere", "Sözleşme uyuşmazlıkları • Revizyon"] },
];

const scrollTo = (href: string) => {
  const el = document.querySelector(href);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  }
};

const PracticeAreas = () => {
  return (
    <section id="calisma-alanlari" className="py-20 bg-background">
      <div className="section-container">
        <div className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <div>
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-accent before:content-[''] before:w-6 before:h-[1.5px] before:bg-accent">
              Uzmanlık
            </motion.span>
            <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep mt-3">
              Çalışma Alanları
            </motion.h3>
          </div>
          <motion.button initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            onClick={() => scrollTo("#iletisim")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-pale text-primary-deep font-semibold text-[13px] border border-accent/15 hover:bg-accent/20 hover:-translate-y-0.5 transition-all">
            <Phone className="w-3.5 h-3.5" /> Hızlı Randevu
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {areas.map((area, i) => (
            <motion.div
              key={area.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
              className="bg-card border border-border rounded-2xl p-7 group hover:-translate-y-1 hover:shadow-elegant-lg hover:border-accent/25 transition-all duration-400"
            >
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-primary bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] border border-primary/[0.08] mb-4 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-deep group-hover:text-accent-light group-hover:scale-105 transition-all duration-300">
                <area.icon className="w-5 h-5" />
              </div>
              <h4 className="font-display text-xl font-bold text-primary-deep mb-2">{area.title}</h4>
              <ul className="space-y-1.5">
                {area.items.map((item, j) => (
                  <li key={j} className="text-[14.5px] leading-relaxed text-muted-foreground">
                    <span className="text-accent font-bold mr-2">—</span>{item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PracticeAreas;

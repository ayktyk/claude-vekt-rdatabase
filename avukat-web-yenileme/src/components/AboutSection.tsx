import { motion } from "framer-motion";
import { Target, Compass, Cpu } from "lucide-react";

const cards = [
  {
    num: "01",
    icon: Target,
    title: "Misyon",
    desc: "Vaka-özel strateji, disiplinli süreç yönetimi ve güçlü müzakere ile müvekkillerimizin zamanını ve maliyetini optimize eden çözümler üretiyoruz.",
    border: "border-t-primary",
  },
  {
    num: "02",
    icon: Compass,
    title: "Yaklaşım",
    desc: "Uyuşmazlığı erken safhada analiz ediyor, delil-ekonomi ilkesi ve güncel içtihat dengesiyle en rasyonel yolu öneriyoruz.",
    border: "border-t-accent",
  },
  {
    num: "03",
    icon: Cpu,
    title: "Teknoloji",
    desc: "Hukuki araştırma ve belge otomasyonunda yapay zekâ destekli araçlar kullanıyor; süreç şeffaflığı için düzenli raporlama yapıyoruz.",
    border: "border-t-primary-light",
  },
];

const steps = [
  { num: "1", title: "Görüşme", desc: "Ücretsiz ön değerlendirme" },
  { num: "2", title: "Analiz", desc: "Dosya ve risk analizi" },
  { num: "3", title: "Strateji", desc: "Yol haritası belirleme" },
  { num: "4", title: "Çözüm", desc: "Sonuç odaklı takip" },
];

const AboutSection = () => {
  return (
    <section id="hakkimizda" className="py-20 bg-cream">
      <div className="section-container">
        <div className="flex flex-wrap items-end justify-between gap-5 mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-accent before:content-[''] before:w-6 before:h-[1.5px] before:bg-accent"
            >
              Hakkımızda
            </motion.span>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep mt-3"
            >
              Güven, gizlilik
              <br />
              ve etik ilkesiyle.
            </motion.h3>
          </div>
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-pale text-primary-deep font-semibold text-[13px] border border-accent/15"
          >
            🛡️ Güven • Gizlilik • Etik
          </motion.span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-card border border-border rounded-2xl p-7 relative overflow-hidden border-t-[3px] ${card.border} group hover:-translate-y-1 hover:shadow-elegant-lg transition-all duration-400`}
            >
              <span className="absolute top-4 right-5 font-display text-5xl font-bold text-primary/[0.06] leading-none">
                {card.num}
              </span>
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-primary bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] border border-primary/[0.08] mb-4 group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-deep group-hover:text-accent-light transition-all duration-300">
                <card.icon className="w-5 h-5" />
              </div>
              <h4 className="font-display text-xl font-bold text-primary-deep mb-2">{card.title}</h4>
              <div className="gold-line mb-3" />
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{card.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10 relative"
        >
          <div className="hidden md:block absolute top-6 left-[12%] right-[12%] h-[2px] bg-border" />
          {steps.map((step, i) => (
            <div key={step.num} className="text-center relative group">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-12 h-12 rounded-full bg-card border-2 border-border inline-flex items-center justify-center font-display text-lg font-bold text-primary relative z-10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300 mx-auto mb-3"
              >
                {step.num}
              </motion.div>
              <h5 className="font-display text-base font-bold text-primary-deep mb-1">{step.title}</h5>
              <p className="text-[13px] text-muted-foreground max-w-[18ch] mx-auto">{step.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;

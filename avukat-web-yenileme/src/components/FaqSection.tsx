import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

const faqs = [
  {
    q: "Ücretlendirme nasıl belirleniyor?",
    a: "Dosyanın kapsamı, harcanacak emek ve süre, risk profili ve Avukatlık Asgari Ücret Tarifesi dikkate alınır. Şeffaf teklif verilir.",
  },
  {
    q: "Ne kadar sürede dönüş yaparsınız?",
    a: "Mesai saatlerinde aynı gün; acil durumlarda öncelikli dönüş yapılır.",
  },
  {
    q: "Danışmanlık sözleşmesi şart mı?",
    a: "Evet, tarafların hak ve yükümlülüklerini netleştirmek ve KVKK uyumu için yazılı sözleşme düzenlenir.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.a,
    },
  })),
};

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = "faq-structured-data";
    let script = document.getElementById(id) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(faqStructuredData);

    return () => {
      script?.remove();
    };
  }, []);

  return (
    <section id="sss" className="py-20 bg-cream">
      <div className="section-container">
        <div className="mb-10">
          <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-xs font-bold tracking-[2.5px] uppercase text-accent before:content-[''] before:w-6 before:h-[1.5px] before:bg-accent">
            SSS
          </motion.span>
          <motion.h3 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep mt-3">
            Sık Sorulan Sorular
          </motion.h3>
          <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
            className="text-base leading-relaxed text-muted-foreground mt-4">
            Kısa, net ve anlaşılır yanıtlar.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-border rounded-2xl p-7 cursor-pointer hover:-translate-y-1 hover:shadow-elegant-lg transition-all duration-400"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <div className="flex items-center justify-between gap-4">
                <h4 className="font-display text-lg font-bold text-primary-deep">{faq.q}</h4>
                <Plus className={`w-5 h-5 text-accent flex-shrink-0 transition-transform duration-300 ${openIndex === i ? "rotate-45" : ""}`} />
              </div>
              <motion.div
                initial={false}
                animate={{ height: openIndex === i ? "auto" : 0, opacity: openIndex === i ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-[14.5px] leading-relaxed text-muted-foreground mt-3 pb-1">{faq.a}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;

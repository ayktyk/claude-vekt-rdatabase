import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { submitEvaluationRequest } from "@/lib/contact-service";
import { ContactServiceError } from "@/types/contact";

const initialFormState = {
  adsoyad: "",
  email: "",
  telefon: "",
  konu: "",
  mesaj: "",
  kvkkOnay: false,
  website: "",
};

const ContactSection = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitEvaluationRequest(formData);
      setFormData(initialFormState);
      toast({
        title: "Talebiniz alındı",
        description: "Ücretsiz ön değerlendirme talebiniz başarıyla iletildi. En kısa sürede dönüş yapılacak.",
      });
    } catch (error) {
      const message =
        error instanceof ContactServiceError
          ? error.message
          : "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.";

      toast({
        title: "Talep gönderilemedi",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="iletisim" className="bg-background py-20">
      <div className="section-container">
        <div className="mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[2.5px] text-accent before:h-[1.5px] before:w-6 before:bg-accent before:content-['']"
          >
            İletişim
          </motion.span>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mt-3 font-display text-[clamp(30px,4vw,42px)] font-bold leading-[1.15] text-primary-deep"
          >
            Ücretsiz Ön Değerlendirme
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-4 max-w-[72ch] text-base leading-relaxed text-muted-foreground"
          >
            Telefon ve e-posta aynı formda. Size uygun iletişim kanalını bırakın, dosyanızı kısaca yazın; ilk yönlendirmeyi
            hızlıca paylaşalım.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="gradient-navy rounded-2xl p-9 text-primary-foreground"
          >
            <h4 className="font-display text-[22px] font-bold text-accent-light">İletişim Bilgileri</h4>
            <div
              className="gold-line mt-2 mb-6"
              style={{ background: "linear-gradient(90deg, hsl(var(--accent-light)), transparent)" }}
            />

            <div className="space-y-5">
              <div className="flex items-start gap-3.5">
                <MapPin className="mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                <div>
                  <strong className="mb-1 block text-[13px] uppercase tracking-wider text-primary-foreground">Adres</strong>
                  <p className="text-[15px] leading-relaxed text-primary-foreground/75">
                    Osmanağa Mahallesi, Karadut Sokak
                    <br />
                    No:14/10, Kadıköy/İstanbul
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Phone className="mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                <div>
                  <strong className="mb-1 block text-[13px] uppercase tracking-wider text-primary-foreground">Telefon</strong>
                  <a
                    href="tel:+905519814937"
                    className="text-[15px] text-primary-foreground/75 transition-colors hover:text-accent-light"
                  >
                    0551 981 49 37
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3.5">
                <Mail className="mt-1 h-4 w-4 flex-shrink-0 text-accent" />
                <div>
                  <strong className="mb-1 block text-[13px] uppercase tracking-wider text-primary-foreground">E-posta</strong>
                  <a
                    href="mailto:vegalaw.contact@gmail.com"
                    className="text-[15px] text-primary-foreground/75 transition-colors hover:text-accent-light"
                  >
                    vegalaw.contact@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <a
                href="https://wa.me/905519814937"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:border-accent hover:bg-primary-foreground/10"
              >
                WhatsApp
              </a>
              <a
                href="mailto:vegalaw.contact@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:border-accent hover:bg-primary-foreground/10"
              >
                E-posta
              </a>
              <a
                href="tel:+905519814937"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/15 px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-all hover:border-accent hover:bg-primary-foreground/10"
              >
                Ara
              </a>
            </div>

            <div className="mt-5 overflow-hidden rounded-[14px] border border-primary-foreground/10">
              <iframe
                src="https://www.google.com/maps?q=Osmana%C4%9Fa%20Mahallesi%20Karadut%20Sokak%20No%2014%2F10%20Kad%C4%B1k%C3%B6y%20%C4%B0stanbul&output=embed"
                width="100%"
                height="200"
                style={{ border: 0, display: "block", borderRadius: "14px" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Vega Hukuk Konum"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-border bg-card p-9"
          >
            <h4 className="font-display text-[22px] font-bold text-primary-deep">Talep Formu</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Telefon veya e-posta bilgilerinizden en az birini bırakın. İsterseniz ikisini de girebilirsiniz.
            </p>
            <div className="gold-line mt-4 mb-6" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                autoComplete="off"
                tabIndex={-1}
                className="hidden"
                aria-hidden="true"
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold tracking-wide text-foreground">Ad Soyad</label>
                <input
                  className="w-full rounded-[10px] border-[1.5px] border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Adınız Soyadınız"
                  value={formData.adsoyad}
                  onChange={(e) => setFormData({ ...formData, adsoyad: e.target.value })}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold tracking-wide text-foreground">Telefon</label>
                  <input
                    className="w-full rounded-[10px] border-[1.5px] border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="05xx xxx xx xx"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-semibold tracking-wide text-foreground">E-posta</label>
                  <input
                    type="email"
                    className="w-full rounded-[10px] border-[1.5px] border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                    placeholder="ornek@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold tracking-wide text-foreground">Konu</label>
                <input
                  className="w-full rounded-[10px] border-[1.5px] border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Örn. İşe iade, kira, alacak"
                  value={formData.konu}
                  onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold tracking-wide text-foreground">Mesajınız</label>
                <textarea
                  className="min-h-[120px] w-full resize-y rounded-[10px] border-[1.5px] border-border bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  placeholder="Dosyanızı veya sorununuzu kısaca yazın..."
                  rows={5}
                  value={formData.mesaj}
                  onChange={(e) => setFormData({ ...formData, mesaj: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={formData.kvkkOnay}
                  onChange={(e) => setFormData({ ...formData, kvkkOnay: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-border"
                  disabled={submitting}
                />
                <span>
                  Ön değerlendirme talebim kapsamında ilettiğim verilerin benimle iletişime geçilmesi amacıyla işlenmesini
                  kabul ediyorum. Ayrıntılar için{" "}
                  <Link to="/kvkk-aydinlatma" className="font-semibold text-primary underline-offset-4 hover:underline">
                    KVKK aydınlatma metni
                  </Link>
                  .
                </span>
              </label>

              <div className="flex items-center gap-3.5 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-semibold transition-all duration-300 ${
                    submitting
                      ? "cursor-not-allowed bg-primary/70 text-primary-foreground"
                      : "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary-deep hover:shadow-elegant"
                  }`}
                >
                  <Send className="h-4 w-4" /> {submitting ? "Gönderiliyor..." : "Ücretsiz Ön Değerlendirme Al"}
                </button>
                <small className="text-xs text-muted-foreground">
                  Endpoint tanımlı değilse sistem sizi telefon, e-posta veya WhatsApp kanalına yönlendirir.
                </small>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;

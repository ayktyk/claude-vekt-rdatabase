import { MessageCircle, Phone, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

const FloatCTA = () => {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="fixed right-5 bottom-5 z-[60] flex flex-col gap-2.5">
        <a
          href="https://wa.me/905519814937"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elegant-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,.2)]"
        >
          <MessageCircle className="h-4 w-4" /> WhatsApp
        </a>
        <a
          href="tel:+905519814937"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground shadow-elegant-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,.2)]"
        >
          <Phone className="h-4 w-4" /> Ara
        </a>
      </div>

      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed left-5 bottom-5 z-[60] flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elegant transition-all duration-300 hover:bg-primary-deep ${
          showTop ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
        }`}
        aria-label="Sayfa basina don"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  );
};

export default FloatCTA;

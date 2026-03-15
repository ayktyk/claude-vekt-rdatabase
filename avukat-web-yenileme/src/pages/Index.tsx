import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import StatsBar from "@/components/StatsBar";
import AboutSection from "@/components/AboutSection";
import PracticeAreas from "@/components/PracticeAreas";
import TeamSection from "@/components/TeamSection";
import ArticlesSection from "@/components/ArticlesSection";
import LegalUpdatesSection from "@/components/LegalUpdatesSection";
import FaqSection from "@/components/FaqSection";
import ContactSection from "@/components/ContactSection";
import SiteFooter from "@/components/SiteFooter";
import FloatCTA from "@/components/FloatCTA";

const Index = () => {
  return (
    <div className="overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
      <StatsBar />
      <AboutSection />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <PracticeAreas />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <TeamSection />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <ArticlesSection />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <LegalUpdatesSection />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <FaqSection />
      <hr className="h-px border-0 bg-gradient-to-r from-transparent via-border to-transparent" />
      <ContactSection />
      <SiteFooter />
      <FloatCTA />
    </div>
  );
};

export default Index;

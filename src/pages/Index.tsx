import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <HowItWorks />
      <CTABanner />
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default Index;

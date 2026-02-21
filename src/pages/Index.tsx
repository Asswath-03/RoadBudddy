import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import ParallaxBackground from "@/components/ParallaxBackground";

const Index = () => {
  return (
    <ParallaxBackground>
      <Navbar />
      <HeroSection />
      <ServicesSection />
      <HowItWorks />
      <CTABanner />
      <Footer />
      <ChatbotWidget />
    </ParallaxBackground>
  );
};

export default Index;

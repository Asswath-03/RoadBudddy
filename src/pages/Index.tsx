import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import HowItWorks from "@/components/HowItWorks";
import LiveDispatch from "@/components/LiveDispatch";
import CTABanner from "@/components/CTABanner";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import ParallaxBackground from "@/components/ParallaxBackground";
import DynamicLighting from "@/components/DynamicLighting";
import ParallaxImageSection from "@/components/ParallaxImageSection";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <ParallaxBackground
      fixedOverlay={
        <>
          <DynamicLighting />
          <Navbar />
          <ChatbotWidget />
        </>
      }
    >
      <HeroSection />

      <main className="relative z-10 container mx-auto px-4 pb-16">
        <ParallaxImageSection
          title="Crafted In Real Workshops"
          description="Built around vintage-garage workflows and field-tested mechanic dispatch patterns."
          imageUrl="https://images.unsplash.com/photo-1486006920555-c77dcf18193c?auto=format&fit=crop&w=1800&q=70"
          align="left"
        />
      </main>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.6 }}>
        <ServicesSection />
      </motion.div>

      <main className="relative z-10 container mx-auto px-4">
        <ParallaxImageSection
          title="Roadside Breakdowns, Handled Fast"
          description="From punctures to dead batteries, request flows are tuned for urgent real-world response."
          imageUrl="https://images.unsplash.com/photo-1493236296276-d17357e288a7?auto=format&fit=crop&w=1800&q=70"
          align="right"
        />
      </main>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.6 }}>
        <HowItWorks />
      </motion.div>

      <main className="relative z-10 container mx-auto px-4">
        <ParallaxImageSection
          title="Precision Tools. Faster Resolution."
          description="Live dispatch intelligence and mechanic readiness combine to keep your downtime minimal."
          imageUrl="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1800&q=70"
          align="left"
        />
      </main>

      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-120px" }} transition={{ duration: 0.6 }}>
        <LiveDispatch />
      </motion.div>

      <main className="relative z-10 container mx-auto px-4">
        <ParallaxImageSection
          title="Under Repair, Not Out Of Control"
          description="Track service progress in real time while our network routes support to your exact location."
          imageUrl="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1800&q=70"
          align="right"
        />
      </main>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.55 }}>
        <CTABanner />
      </motion.div>
      <Footer />
    </ParallaxBackground>
  );
};

export default Index;

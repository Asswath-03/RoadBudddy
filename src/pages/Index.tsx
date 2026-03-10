import { useState } from "react";
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
import IntroAnimation from "@/components/IntroAnimation";
import VehicleEvolution from "@/components/VehicleEvolution";
import AppShowcase from "@/components/AppShowcase";
import { motion, AnimatePresence } from "framer-motion";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.6 },
};

/**
 * Returns true the FIRST time this is called in a session (and marks it as seen).
 * All subsequent calls in the same session return false.
 */
const isFirstVisit = (): boolean => {
  if (typeof window === "undefined") return false;
  const key = "roadbuddy_intro_seen";
  if (sessionStorage.getItem(key)) return false;
  sessionStorage.setItem(key, "1");
  return true;
};

const Index = () => {
  // Determine once at mount whether to show the intro
  const [showIntro] = useState(() => isFirstVisit());
  // Page starts hidden only when the intro will show; otherwise immediately visible
  const [pageVisible, setPageVisible] = useState(!showIntro);
  const [introMounted, setIntroMounted] = useState(showIntro);

  const handleIntroDone = () => {
    setIntroMounted(false);
    setPageVisible(true);
  };

  return (
    <>
      {/* Intro splash — fixed overlay rendered above everything */}
      {introMounted && <IntroAnimation onComplete={handleIntroDone} />}

      {/* Main page — fades in after intro completes (or immediately on repeat visits) */}
      <AnimatePresence>
        {pageVisible && (
          <motion.div
            key="main-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            style={{ minHeight: "100vh" }}
          >
            <ParallaxBackground
              fixedOverlay={
                <>
                  <DynamicLighting />
                  <Navbar />
                  <ChatbotWidget />
                </>
              }
            >
              {/* Hero */}
              <HeroSection />

              {/* Services */}
              <motion.div {...fadeUp} style={{ backgroundColor: "#FFFFFF" }}>
                <ServicesSection />
              </motion.div>

              {/* How It Works */}
              <motion.div {...fadeUp} style={{ backgroundColor: "#F1F5F9" }}>
                <HowItWorks />
              </motion.div>

              {/* Vehicle Evolution — vintage → modern transformation */}
              <VehicleEvolution />

              {/* Live Dispatch */}
              <motion.div {...fadeUp} style={{ backgroundColor: "#FFFFFF" }}>
                <LiveDispatch />
              </motion.div>

              {/* App Showcase — phone mockups (after Live Assistance) */}
              <AppShowcase />

              {/* CTA Banner */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55 }}
              >
                <CTABanner />
              </motion.div>

              <Footer />
            </ParallaxBackground>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Index;

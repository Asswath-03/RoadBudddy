import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Wrench, Zap, Fuel } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroBg from "@/assets/hero-bg.jpg";
import ScrollCar from "@/components/ScrollCar";
import MagneticButton from "@/components/MagneticButton";

const headlines = [
  "when you need it most.",
  "anytime, anywhere.",
  "in under 15 minutes.",
];

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  // Typing effect
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    const target = headlines[headlineIdx];
    if (typing) {
      if (displayed.length < target.length) {
        const t = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 60);
        return () => clearTimeout(t);
      } else {
        const t = setTimeout(() => setTyping(false), 2000);
        return () => clearTimeout(t);
      }
    } else {
      if (displayed.length > 0) {
        const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
        return () => clearTimeout(t);
      } else {
        setHeadlineIdx((i) => (i + 1) % headlines.length);
        setTyping(true);
      }
    }
  }, [displayed, typing, headlineIdx]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden hero-sweep">
      {/* Background with parallax */}
      <motion.div className="absolute inset-0" style={isMobile ? {} : { y: bgY }}>
        <img src={heroBg} alt="Roadside assistance at dusk" className="w-full h-full object-cover scale-110" />
      </motion.div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40"
        style={isMobile ? {} : { opacity: overlayOpacity }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

      {/* Floating icons (desktop only) */}
      {!isMobile && (
        <>
          <motion.div
            className="absolute top-32 right-[15%] text-primary/20"
            animate={{ y: [0, -12, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Wrench className="w-12 h-12" />
          </motion.div>
          <motion.div
            className="absolute bottom-40 right-[25%] text-primary/15"
            animate={{ y: [0, -8, 0], rotate: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            <Zap className="w-10 h-10" />
          </motion.div>
          <motion.div
            className="absolute top-1/2 right-[10%] text-primary/10"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          >
            <Fuel className="w-14 h-14" />
          </motion.div>
        </>
      )}

      <div className="relative z-10 container mx-auto px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">24/7 Emergency Roadside Assistance</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-4">
            Help on the road,{" "}
            <span className="text-gradient-primary">
              {displayed}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="inline-block w-[3px] h-[1em] bg-primary ml-1 align-middle"
              />
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg"
          >
            Instant connection to nearby mechanics and service providers.
            Breakdown? We've got your back — in minutes, not hours.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <MagneticButton>
              <Link to="/request-help">
                <Button size="lg" className="gradient-emergency text-primary-foreground animate-glow-pulse btn-sweep font-bold text-lg px-8 py-6 w-full sm:w-auto heartbeat-sos">
                  Request Help Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </MagneticButton>
            <MagneticButton>
              <Link to="/join-partner">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary btn-sweep font-semibold text-lg px-8 py-6 w-full sm:w-auto">
                  Become a Partner
                </Button>
              </Link>
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="flex gap-8 mt-12 pt-8 border-t border-border/50"
          >
            {[
              { value: "500+", label: "Mechanics" },
              { value: "<15min", label: "Avg Response" },
              { value: "24/7", label: "Availability" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.15 }}
              >
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll-linked car animation */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <ScrollCar />
      </div>
    </section>
  );
};

export default HeroSection;

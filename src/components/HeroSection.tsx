import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with parallax */}
      <motion.div className="absolute inset-0" style={isMobile ? {} : { y: bgY }}>
        <img src={heroBg} alt="Roadside assistance at dusk" className="w-full h-full object-cover" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />

      <div className="relative z-10 container mx-auto px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">24/7 Emergency Roadside Assistance</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground leading-tight mb-4">
            Help on the road,{" "}
            <span className="text-gradient-primary">when you need it most.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-lg">
            Instant connection to nearby mechanics and service providers. 
            Breakdown? We've got your back — in minutes, not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/request-help">
              <Button size="lg" className="gradient-emergency text-primary-foreground glow-emergency font-bold text-lg px-8 py-6 w-full sm:w-auto">
                Request Help Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/join-partner">
              <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-secondary font-semibold text-lg px-8 py-6 w-full sm:w-auto">
                Become a Partner
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-border/50">
            {[
              { value: "500+", label: "Mechanics" },
              { value: "<15min", label: "Avg Response" },
              { value: "24/7", label: "Availability" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const CTABanner = () => {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Parallax gradient background */}
      <motion.div
        className="absolute inset-0"
        style={isMobile ? {} : { y: bgY }}
      >
        <div className="absolute inset-0 gradient-emergency opacity-90" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, hsl(25 95% 55% / 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(0 85% 55% / 0.2) 0%, transparent 50%)",
        }} />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6"
          >
            <Phone className="w-4 h-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground">Emergency? Call 1-800-ROAD</span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl font-display font-bold text-primary-foreground mb-4">
            Stranded on the Road?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-lg mx-auto mb-8">
            Don't wait. Get instant help from our network of 500+ verified mechanics available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/request-help">
              <Button size="lg" className="bg-primary-foreground text-emergency hover:bg-primary-foreground/90 btn-sweep font-bold text-lg px-8 py-6">
                Get Help Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/join-partner">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 btn-sweep font-semibold text-lg px-8 py-6">
                Join as Mechanic
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;

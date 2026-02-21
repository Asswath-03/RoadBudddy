import { MapPin, Search, CheckCircle } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const steps = [
  { icon: MapPin, title: "Share Your Location", description: "We detect your GPS or you pin your breakdown spot" },
  { icon: Search, title: "We Find Help Nearby", description: "Our system matches you with the closest available mechanic" },
  { icon: CheckCircle, title: "Help Arrives Fast", description: "Track your mechanic in real-time until they reach you" },
];

const HowItWorks = () => {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["40px", "-40px"]);

  return (
    <section ref={ref} className="py-24 relative overflow-hidden section-glow-accent">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(circle at 25% 25%, hsl(25 95% 55%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      <motion.div className="container mx-auto px-4 relative z-10" style={isMobile ? {} : { y: contentY }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            How It <span className="text-gradient-primary">Works</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Three simple steps to get back on the road.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className="text-center group"
            >
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="relative mx-auto w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6 group-hover:border-primary/60 transition-colors duration-300"
              >
                <step.icon className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                  {i + 1}
                </span>
                {/* Pulse ring on hover */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/0 group-hover:border-primary/20 group-hover:scale-125 transition-all duration-500" />
              </motion.div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>

              {/* Connector line (desktop) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[calc(50%+60px)] w-[calc(100%-120px)] h-px bg-gradient-to-r from-primary/30 to-primary/10" />
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;

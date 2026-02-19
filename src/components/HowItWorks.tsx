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
    <section ref={ref} className="py-24 relative overflow-hidden">
      <motion.div className="container mx-auto px-4" style={isMobile ? {} : { y: contentY }}>
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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center"
            >
              <div className="relative mx-auto w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-6">
                <step.icon className="w-8 h-8 text-primary" />
                <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-display font-bold text-sm">
                  {i + 1}
                </span>
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default HowItWorks;

import { Wrench, Zap, Fuel, Truck, CircleDot, Bike } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import TiltCard from "@/components/TiltCard";

const services = [
  { icon: CircleDot, title: "Tyre Puncture Repair", description: "Quick tyre fixes and replacements on-site" },
  { icon: Wrench, title: "Car Mechanics", description: "Expert car diagnostics and roadside repairs" },
  { icon: Bike, title: "Bike Mechanics", description: "Two-wheeler breakdown support anywhere" },
  { icon: Zap, title: "Battery Jumpstart", description: "Dead battery? We'll get you running in minutes" },
  { icon: Fuel, title: "Fuel Delivery", description: "Ran out of fuel? We deliver to your location" },
  { icon: Truck, title: "Towing Services", description: "Safe vehicle towing to your preferred garage" },
];

const ServiceCard = ({ service, index }: { service: typeof services[0]; index: number }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <TiltCard className="group" glowColor="hsl(25, 95%, 55%)">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="p-6 rounded-xl glass border border-border/50 hover:border-primary/40 transition-all duration-300 card-lift relative overflow-hidden depth-shadow"
      >
        <div className="relative z-10">
          <motion.div
            animate={hovered ? { rotateY: 360 } : { rotateY: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4"
            style={{ perspective: 600 }}
          >
            <service.icon className="w-6 h-6 text-primary-foreground" />
          </motion.div>
          <h3 className="text-xl font-display font-semibold text-foreground mb-2">{service.title}</h3>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </motion.div>
    </TiltCard>
  );
};

const ServicesSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["50px", "-50px"]);

  return (
    <section ref={ref} id="services" className="py-24 relative overflow-hidden section-glow-primary">
      <motion.div className="container mx-auto px-4" style={isMobile ? {} : { y: contentY }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Our <span className="text-gradient-primary">Services</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Whatever the breakdown, we've got a specialist ready to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <ServiceCard key={service.title} service={service} index={i} />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default ServicesSection;

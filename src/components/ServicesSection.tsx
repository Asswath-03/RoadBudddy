import { Wrench, Zap, Fuel, Truck, CircleDot, Bike } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: CircleDot, title: "Tyre Puncture Repair", description: "Quick tyre fixes and replacements on-site" },
  { icon: Wrench, title: "Car Mechanics", description: "Expert car diagnostics and roadside repairs" },
  { icon: Bike, title: "Bike Mechanics", description: "Two-wheeler breakdown support anywhere" },
  { icon: Zap, title: "Battery Jumpstart", description: "Dead battery? We'll get you running in minutes" },
  { icon: Fuel, title: "Fuel Delivery", description: "Ran out of fuel? We deliver to your location" },
  { icon: Truck, title: "Towing Services", description: "Safe vehicle towing to your preferred garage" },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-card">
      <div className="container mx-auto px-4">
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
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all duration-300 hover:glow-primary"
            >
              <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <service.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-semibold text-foreground mb-2">{service.title}</h3>
              <p className="text-muted-foreground">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

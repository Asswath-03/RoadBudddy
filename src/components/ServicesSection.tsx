import { Wrench, Zap, Fuel, Truck, CircleDot, Bike } from "lucide-react";
import { motion } from "framer-motion";

const services = [
  { icon: CircleDot, title: "Tyre Puncture Repair", description: "Quick tyre fixes and replacements delivered to your exact location." },
  { icon: Wrench, title: "Car Mechanics", description: "Expert car diagnostics and roadside repairs by certified mechanics." },
  { icon: Bike, title: "Bike Mechanics", description: "Two-wheeler breakdown support anywhere, anytime you need it." },
  { icon: Zap, title: "Battery Jumpstart", description: "Dead battery? We'll get you running again in just minutes." },
  { icon: Fuel, title: "Fuel Delivery", description: "Ran out of fuel? We deliver directly to your location fast." },
  { icon: Truck, title: "Towing Services", description: "Safe and reliable vehicle towing to your preferred garage." },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0F172A] mb-4 tracking-tight">
            Our <span className="text-[#1D4ED8]">Services</span>
          </h2>
          <p className="text-[#475569] text-lg max-w-md mx-auto">
            Whatever the breakdown, we've got a specialist ready to help.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="cinematic-card p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-[0_1px_3px_rgb(0_0_0/0.04)] hover:shadow-[0_8px_24px_rgb(0_0_0/0.06)] hover:border-[#1D4ED8]/20 transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 rounded-xl bg-[#1D4ED8]/8 flex items-center justify-center mb-4 group-hover:bg-[#1D4ED8]/12 transition-colors duration-300">
                <service.icon className="icon-float w-6 h-6 text-[#1D4ED8]" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{service.title}</h3>
              <p className="text-[#475569] text-sm leading-relaxed">{service.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;

import { MapPin, Search, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  { icon: MapPin, title: "Share Your Location", description: "We detect your GPS or you pin your breakdown spot on the map." },
  { icon: Search, title: "We Find Help Nearby", description: "Our system instantly matches you with the closest available mechanic." },
  { icon: CheckCircle, title: "Help Arrives Fast", description: "Track your mechanic in real-time until they reach you." },
];

const HowItWorks = () => {
  return (
    <section className="py-24 bg-[#F8FAFC]">
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
            How It <span className="text-[#1D4ED8]">Works</span>
          </h2>
          <p className="text-[#475569] text-lg max-w-md mx-auto">
            Three simple steps to get back on the road.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="cinematic-card text-center rounded-2xl p-4"
            >
              {/* Step circle */}
              <div className="relative mx-auto w-20 h-20 rounded-full bg-[#1D4ED8]/8 border-2 border-[#1D4ED8]/20 flex items-center justify-center mb-6 group">
                <step.icon className="icon-float w-8 h-8 text-[#1D4ED8]" />
                <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#1D4ED8] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-[#0F172A] mb-2">{step.title}</h3>
              <p className="text-[#475569] text-sm leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

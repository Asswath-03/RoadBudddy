import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Phone, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CTABanner = () => {
  return (
    <section className="py-20 bg-[#1D4ED8] relative overflow-hidden">
      {/* Subtle decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {/* Emergency badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 mb-6">
            <Phone className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Emergency? Call 1-800-ROAD</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Stranded on the Road?
          </h2>
          <p className="text-lg text-white/80 max-w-lg mx-auto mb-10">
            Don't wait. Get instant help from our network of 500+ verified mechanics available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/request-help">
              <Button
                size="lg"
                className="cinematic-button bg-white text-[#1D4ED8] hover:bg-white/90 font-semibold text-base px-8 py-6 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Help Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/join-partner">
              <Button
                size="lg"
                className="cinematic-button bg-transparent border-2 border-white text-white hover:bg-white hover:text-[#1D4ED8] font-semibold text-base px-8 py-6 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
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

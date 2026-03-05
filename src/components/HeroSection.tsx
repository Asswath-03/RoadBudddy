import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Clock, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section
      className="relative pt-28 pb-24 overflow-hidden"
      style={{ backgroundColor: "#F8FAFC" }}
    >
      {/* Subtle decorative gradient blobs — light version */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 50%, rgba(59,130,246,0.07) 0%, transparent 50%), " +
            "radial-gradient(circle at 85% 20%, rgba(99,102,241,0.07) 0%, transparent 45%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2"
          >
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              24/7 Emergency Roadside Response
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            Instant roadside assistance,
            <span className="block text-blue-600 mt-1">
              engineered for real emergencies.
            </span>
          </motion.h1>

          {/* Sub-text */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg"
          >
            Connect instantly with nearby mechanics, live ETA tracking, and verified
            on-road support that arrives in minutes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link to="/request-help">
              <Button
                size="lg"
                className="cinematic-button w-full bg-blue-600 px-8 py-6 text-base font-semibold text-white hover:bg-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.28)] sm:w-auto"
              >
                Request Help Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/join-partner">
              <Button
                size="lg"
                variant="outline"
                className="cinematic-button w-full border-slate-300 bg-white px-8 py-6 text-base font-semibold text-slate-800 hover:bg-slate-50 hover:border-blue-400 sm:w-auto"
              >
                Become a Partner
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.55 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              <span>Average 12-min response</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span>Real-time mechanic tracking</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-slate-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>Verified partner network</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;

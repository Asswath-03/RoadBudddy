import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.13]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-10%"]);

  return (
    <section ref={heroRef} className="relative min-h-[96vh] overflow-hidden pt-28">
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ y: backgroundY, scale: backgroundScale }}
      >
        <img
          src={heroBg}
          alt="Vintage roadside mechanic repair scene"
          className="h-full w-full object-cover"
          loading="eager"
          decoding="async"
        />
      </motion.div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#050b14]/30 via-[#050b14]/62 to-[#050b14]/92" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_25%,rgba(255,197,120,0.24),transparent_34%),radial-gradient(circle_at_74%_68%,rgba(93,137,255,0.24),transparent_38%)]" />

      <motion.div
        className="relative z-10 container mx-auto px-4 pb-20"
        style={{ y: textY }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 backdrop-blur-sm"
          >
            <ShieldCheck className="h-4 w-4 text-[#9CB8FF]" />
            <span className="text-sm font-medium text-white">24/7 Emergency Roadside Response</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 42 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl"
          >
            Cinematic roadside assistance,
            <span className="block text-[#9CB8FF]">engineered for real emergencies.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-slate-200 md:text-xl"
          >
            Connect instantly with nearby mechanics, live ETA tracking, and verified on-road support that arrives in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
          >
            <Link to="/request-help">
              <Button
                size="lg"
                className="cinematic-button w-full bg-[#2A5BFF] px-8 py-6 text-base font-semibold text-white shadow-[0_14px_34px_rgba(42,91,255,0.4)] hover:bg-[#1C4BF4] sm:w-auto"
              >
                Request Help Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/join-partner">
              <Button
                size="lg"
                variant="outline"
                className="cinematic-button w-full border-white/40 bg-white/10 px-8 py-6 text-base font-semibold text-white backdrop-blur-sm hover:bg-white hover:text-[#0F172A] sm:w-auto"
              >
                Become a Partner
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;

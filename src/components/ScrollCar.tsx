import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const ScrollCar = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  const carX = useTransform(scrollYProgress, [0, 1], ["-20%", "110%"]);
  const wheelRotate = useTransform(scrollYProgress, [0, 1], [0, 1440]);
  const shadowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.2, 0.8]);

  if (isMobile) return null;

  return (
    <div ref={ref} className="relative w-full h-24 overflow-hidden my-4">
      {/* Road surface */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[hsl(220,15%,10%)] to-transparent" />

      {/* Animated road lines */}
      <motion.div
        className="absolute bottom-5 left-0 right-0 h-[2px] opacity-30"
        style={{
          backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--primary)) 0px, hsl(var(--primary)) 30px, transparent 30px, transparent 60px)",
          backgroundSize: "60px 2px",
        }}
        animate={{ backgroundPositionX: ["0px", "-60px"] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />

      {/* Car body */}
      <motion.div
        className="absolute bottom-6 will-change-transform"
        style={{ x: carX }}
      >
        {/* Shadow */}
        <motion.div
          className="absolute -bottom-3 left-2 right-2 h-3 rounded-full bg-black/30 blur-md"
          style={{ scaleX: shadowScale }}
        />

        {/* Car SVG */}
        <svg width="80" height="36" viewBox="0 0 80 36" fill="none" className="drop-shadow-lg">
          {/* Body */}
          <path d="M10 24 L14 12 L28 6 L56 6 L66 12 L72 24 Z" fill="hsl(25, 95%, 55%)" />
          <path d="M10 24 L72 24 L74 28 L8 28 Z" fill="hsl(25, 85%, 45%)" />
          {/* Windows */}
          <path d="M16 13 L27 8 L40 8 L40 18 L16 18 Z" fill="hsl(220, 30%, 20%)" opacity="0.7" />
          <path d="M42 8 L55 8 L63 13 L63 18 L42 18 Z" fill="hsl(220, 30%, 20%)" opacity="0.7" />
          {/* Headlight */}
          <rect x="68" y="16" width="6" height="4" rx="1" fill="hsl(50, 100%, 80%)" />
          {/* Taillight */}
          <rect x="8" y="16" width="4" height="4" rx="1" fill="hsl(0, 85%, 55%)" />
        </svg>

        {/* Front wheel */}
        <motion.div
          className="absolute bottom-[-4px] right-[12px] w-[14px] h-[14px] rounded-full border-2 border-[hsl(220,15%,30%)] bg-[hsl(220,15%,20%)]"
          style={{ rotate: wheelRotate }}
        >
          <div className="absolute inset-[3px] rounded-full border border-[hsl(220,15%,35%)]" />
        </motion.div>

        {/* Rear wheel */}
        <motion.div
          className="absolute bottom-[-4px] left-[12px] w-[14px] h-[14px] rounded-full border-2 border-[hsl(220,15%,30%)] bg-[hsl(220,15%,20%)]"
          style={{ rotate: wheelRotate }}
        >
          <div className="absolute inset-[3px] rounded-full border border-[hsl(220,15%,35%)]" />
        </motion.div>

        {/* Headlight glow */}
        <div className="absolute right-[-8px] top-[14px] w-16 h-8 bg-[hsl(50,100%,80%)] opacity-[0.06] blur-xl rounded-full" />
      </motion.div>
    </div>
  );
};

export default ScrollCar;

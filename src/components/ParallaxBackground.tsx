import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRef } from "react";

const FloatingOrb = ({
  size,
  color,
  top,
  left,
  delay,
  duration,
}: {
  size: number;
  color: string;
  top: string;
  left: string;
  delay: number;
  duration: number;
}) => {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <motion.div
      className="absolute rounded-full pointer-events-none will-change-transform"
      style={{
        width: size,
        height: size,
        top,
        left,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: "blur(60px)",
      }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
};

const ParallaxBackground = ({ children }: { children: React.ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll();
  const gradientY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div ref={ref} className="relative min-h-screen overflow-hidden">
      {/* Base gradient layer */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-[hsl(220,30%,7%)] via-[hsl(225,25%,5%)] to-[hsl(0,0%,0%)]" />

      {/* Animated gradient mesh */}
      {!isMobile && (
        <motion.div
          className="fixed inset-0 z-0 will-change-transform"
          style={{ y: gradientY }}
        >
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 20% 40%, hsl(25 95% 55% / 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 75% 60%, hsl(0 85% 55% / 0.06) 0%, transparent 50%), radial-gradient(ellipse 90% 60% at 50% 90%, hsl(220 40% 30% / 0.15) 0%, transparent 60%)",
            }}
          />
        </motion.div>
      )}

      {/* Floating orbs */}
      <FloatingOrb size={300} color="hsl(25 95% 55% / 0.04)" top="10%" left="5%" delay={0} duration={8} />
      <FloatingOrb size={200} color="hsl(0 85% 55% / 0.03)" top="40%" left="80%" delay={2} duration={10} />
      <FloatingOrb size={250} color="hsl(220 60% 50% / 0.04)" top="70%" left="20%" delay={4} duration={12} />
      <FloatingOrb size={180} color="hsl(25 95% 55% / 0.03)" top="85%" left="65%" delay={1} duration={9} />

      {/* Animated road-line pattern (desktop only) */}
      {!isMobile && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute left-1/2 top-0 w-px h-full opacity-[0.04]"
            style={{
              background: "repeating-linear-gradient(180deg, hsl(25 95% 55%) 0px, hsl(25 95% 55%) 40px, transparent 40px, transparent 80px)",
            }}
            animate={{ y: [0, 80] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute left-[30%] top-0 w-px h-full opacity-[0.02]"
            style={{
              background: "repeating-linear-gradient(180deg, hsl(0 0% 50%) 0px, hsl(0 0% 50%) 20px, transparent 20px, transparent 60px)",
            }}
            animate={{ y: [0, 60] }}
            transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute left-[70%] top-0 w-px h-full opacity-[0.02]"
            style={{
              background: "repeating-linear-gradient(180deg, hsl(0 0% 50%) 0px, hsl(0 0% 50%) 20px, transparent 20px, transparent 60px)",
            }}
            animate={{ y: [0, 60] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 2 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ParallaxBackground;

import { useEffect, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const DynamicLighting = () => {
  const isMobile = useIsMobile();
  const [pos, setPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isMobile) return;
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setPos({ x, y });
    },
    [isMobile]
  );

  useEffect(() => {
    if (isMobile) return;
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, isMobile]);

  if (isMobile) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-[1] transition-opacity duration-1000"
      style={{
        background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, hsl(25 95% 55% / 0.03), transparent 60%)`,
      }}
    />
  );
};

export default DynamicLighting;

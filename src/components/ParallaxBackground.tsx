import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import heroBg from "@/assets/hero-bg.jpg";

interface ParallaxBackgroundProps {
  children: ReactNode;
  fixedOverlay?: ReactNode;
}

const ParallaxBackground = ({ children, fixedOverlay }: ParallaxBackgroundProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const heightRef = useRef(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [smoothEnabled, setSmoothEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMode = () => setSmoothEnabled(!media.matches);

    updateMode();
    media.addEventListener("change", updateMode);
    return () => media.removeEventListener("change", updateMode);
  }, []);

  useEffect(() => {
    if (!smoothEnabled || !contentRef.current) {
      return;
    }

    const root = document.documentElement;
    const content = contentRef.current;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const lerp = isMobile ? 0.16 : 0.11;

    let current = window.scrollY;
    let target = window.scrollY;

    const updateHeight = () => {
      const nextHeight = content.getBoundingClientRect().height;
      heightRef.current = nextHeight;
      setContentHeight((prev) => (Math.abs(prev - nextHeight) > 1 ? nextHeight : prev));
    };

    const updateFrame = () => {
      target = window.scrollY;
      current += (target - current) * lerp;

      if (Math.abs(target - current) < 0.1) {
        current = target;
      }

      const maxScroll = Math.max(heightRef.current - window.innerHeight, 1);
      const progress = Math.min(Math.max(current / maxScroll, 0), 1);
      const drift = Math.sin(current * 0.0017) * 24;

      content.style.transform = `translate3d(0, ${-current}px, 0)`;
      root.style.setProperty("--smooth-scroll-y", `${current}px`);
      root.style.setProperty("--smooth-scroll-progress", progress.toFixed(4));
      root.style.setProperty("--smooth-scroll-drift", `${drift.toFixed(2)}px`);

      rafRef.current = window.requestAnimationFrame(updateFrame);
    };

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(content);
    updateHeight();

    content.style.position = "fixed";
    content.style.inset = "0";
    content.style.width = "100%";
    content.style.willChange = "transform";

    rafRef.current = window.requestAnimationFrame(updateFrame);

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      resizeObserver.disconnect();
      content.style.position = "";
      content.style.inset = "";
      content.style.width = "";
      content.style.transform = "";
      content.style.willChange = "";
      root.style.removeProperty("--smooth-scroll-y");
      root.style.removeProperty("--smooth-scroll-progress");
      root.style.removeProperty("--smooth-scroll-drift");
    };
  }, [smoothEnabled]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0B1220]">
      <div className="cinematic-noise" aria-hidden="true" />
      <div
        className="cinematic-parallax-layer cinematic-parallax-back"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(9,15,26,0.4) 0%, rgba(9,15,26,0.85) 100%), url(${heroBg})`,
        }}
        aria-hidden="true"
      />
      <div
        className="cinematic-parallax-layer cinematic-parallax-mid"
        style={{
          backgroundImage:
            "radial-gradient(circle at 28% 25%, rgba(255,180,95,0.24), transparent 34%), radial-gradient(circle at 72% 58%, rgba(110,157,255,0.22), transparent 36%), linear-gradient(120deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
        }}
        aria-hidden="true"
      />

      <div ref={contentRef} className="relative z-20">
        {children}
      </div>
      {smoothEnabled ? <div style={{ height: contentHeight }} aria-hidden="true" /> : null}

      {fixedOverlay ? <div className="relative z-40">{fixedOverlay}</div> : null}
    </div>
  );
};

export default ParallaxBackground;

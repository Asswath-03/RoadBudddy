import type { ReactNode } from "react";

interface ParallaxBackgroundProps {
  children: ReactNode;
  fixedOverlay?: ReactNode;
}

/**
 * Clean page wrapper — replaces the cinematic parallax/scroll-lock system
 * with a simple light-theme container that lets the browser scroll naturally.
 * 
 * The fixedOverlay (Navbar, ChatbotWidget) is rendered outside the flow so
 * that position:fixed children work correctly.
 */
const ParallaxBackground = ({ children, fixedOverlay }: ParallaxBackgroundProps) => {
  return (
    <>
      {/* Fixed overlay (Navbar, ChatbotWidget) — outside normal flow */}
      {fixedOverlay}

      {/* Scrollable page content */}
      <div
        style={{
          backgroundColor: "#F8FAFC",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </>
  );
};

export default ParallaxBackground;

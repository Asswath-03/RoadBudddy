import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo.png";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/#services" },
  { label: "Request Help", path: "/request-help" },
  { label: "Become a Partner", path: "/join-partner" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] shadow-[0_1px_3px_rgb(0_0_0/0.05)] h-14"
          : "bg-white/80 backdrop-blur-sm border-b border-transparent h-16"
        }`}
    >
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={logoImg}
            alt="RoadBuddy Logo"
            className={`rounded-full object-contain transition-all duration-300 ${scrolled ? "w-8 h-8" : "w-10 h-10"
              }`}
          />
          <span className="font-bold text-lg text-[#0F172A]">
            Road<span className="text-[#1D4ED8]">Buddy</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors nav-link-animated ${location.pathname === link.path
                  ? "text-[#1D4ED8]"
                  : "text-[#475569] hover:text-[#1D4ED8]"
                }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="tel:+1800ROADBUDDY"
            className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors"
          >
            <Phone className="w-4 h-4" />
            1-800-ROAD
          </a>
          <Link to="/request-help">
            <Button
              size="sm"
              className="cinematic-button bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] shadow-sm"
            >
              Get Help
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-[#0F172A] p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-y-0 right-0 w-3/4 bg-white border-l border-[#E2E8F0] shadow-xl"
          >
            <div className="flex flex-col p-6 gap-2 pt-20">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="text-base font-medium py-3 text-[#475569] hover:text-[#1D4ED8] transition-colors block border-b border-[#F1F5F9]"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-4"
              >
                <Link to="/request-help" onClick={() => setMobileOpen(false)}>
                  <Button className="cinematic-button w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-medium rounded-lg">
                    Get Help Now
                  </Button>
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

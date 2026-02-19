import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? "bg-background/90 backdrop-blur-xl border-border shadow-lg shadow-background/20 h-14"
          : "bg-background/60 backdrop-blur-md border-transparent h-16"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between h-full px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400 }}
            className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"
          >
            <span className="text-primary-foreground font-display font-bold text-sm">RB</span>
          </motion.div>
          <span className="font-display font-bold text-lg text-foreground">
            Road<span className="text-primary">Buddy</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-sm font-medium transition-colors nav-link-animated ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="tel:+1800ROADBUDDY" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Phone className="w-4 h-4" />
            1-800-ROAD
          </a>
          <Link to="/request-help">
            <Button size="sm" className="gradient-emergency text-primary-foreground animate-glow-pulse btn-sweep font-semibold">
              SOS Help
            </Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </motion.button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-y-0 right-0 w-3/4 bg-card/95 backdrop-blur-xl border-l border-border overflow-hidden shadow-2xl"
          >
            <div className="flex flex-col p-6 gap-4 pt-20">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-display font-medium py-2 text-muted-foreground hover:text-primary transition-colors block"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link to="/request-help" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full gradient-emergency text-primary-foreground animate-glow-pulse font-semibold mt-4">
                    SOS Help
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
            className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-sm -z-10"
          />
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;

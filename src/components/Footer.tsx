import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12 relative light-sweep">
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-display font-bold text-sm">RB</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Road<span className="text-primary">Buddy</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm">
              Help on the road, when you need it most.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors nav-link-animated w-fit">Home</Link>
              <Link to="/request-help" className="text-sm text-muted-foreground hover:text-primary transition-colors nav-link-animated w-fit">Request Help</Link>
              <Link to="/join-partner" className="text-sm text-muted-foreground hover:text-primary transition-colors nav-link-animated w-fit">Join as Partner</Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-display font-semibold text-foreground mb-4">Services</h4>
            <div className="flex flex-col gap-2">
              {["Tyre Repair", "Battery Jumpstart", "Fuel Delivery", "Towing"].map((s) => (
                <span key={s} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-default">{s}</span>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+18001234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Phone className="w-4 h-4 group-hover:animate-float" /> 1-800-123-4567
              </a>
              <a href="mailto:help@roadbuddy.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group">
                <Mail className="w-4 h-4 group-hover:animate-float" /> help@roadbuddy.com
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground group">
                <MapPin className="w-4 h-4 group-hover:animate-float" /> Available Nationwide
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="border-t border-border mt-8 pt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">© 2026 RoadBuddy. All rights reserved.</p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;

import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-[#F1F5F9] border-t border-[#E2E8F0] py-14">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src={logoImg}
                alt="RoadBuddy Logo"
                className="w-9 h-9 rounded-full object-contain"
              />
              <span className="font-bold text-lg text-[#0F172A]">
                Road<span className="text-[#1D4ED8]">Buddy</span>
              </span>
            </div>
            <p className="text-[#475569] text-sm leading-relaxed">
              Help on the road, when you need it most. Trusted by thousands of drivers nationwide.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h4 className="font-semibold text-[#0F172A] mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/" className="text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors">Home</Link>
              <Link to="/request-help" className="text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors">Request Help</Link>
              <Link to="/join-partner" className="text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors">Join as Partner</Link>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-semibold text-[#0F172A] mb-4">Services</h4>
            <div className="flex flex-col gap-2.5">
              {["Tyre Repair", "Battery Jumpstart", "Fuel Delivery", "Towing"].map((s) => (
                <span key={s} className="text-sm text-[#475569]">{s}</span>
              ))}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-semibold text-[#0F172A] mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+18001234567" className="flex items-center gap-2 text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors">
                <Phone className="w-4 h-4" /> 1-800-123-4567
              </a>
              <a href="mailto:helproadbuddy@gmail.com" className="flex items-center gap-2 text-sm text-[#475569] hover:text-[#1D4ED8] transition-colors">
                <Mail className="w-4 h-4" /> helproadbuddy@gmail.com
              </a>
              <span className="flex items-center gap-2 text-sm text-[#475569]">
                <MapPin className="w-4 h-4" /> Available Nationwide
              </span>
            </div>
          </motion.div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#E2E8F0] mt-10 pt-8 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-[#94A3B8]">© 2026 RoadBuddy. All rights reserved.</p>
          {/* Visible Admin link */}
          <Link
            to="/admin"
            className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#1D4ED8] font-medium transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Admin Login
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

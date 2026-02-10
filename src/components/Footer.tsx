import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
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
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">Home</Link>
              <Link to="/request-help" className="text-sm text-muted-foreground hover:text-primary transition-colors">Request Help</Link>
              <Link to="/join-partner" className="text-sm text-muted-foreground hover:text-primary transition-colors">Join as Partner</Link>
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Services</h4>
            <div className="flex flex-col gap-2">
              {["Tyre Repair", "Battery Jumpstart", "Fuel Delivery", "Towing"].map((s) => (
                <span key={s} className="text-sm text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-foreground mb-4">Contact</h4>
            <div className="flex flex-col gap-3">
              <a href="tel:+18001234567" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Phone className="w-4 h-4" /> 1-800-123-4567
              </a>
              <a href="mailto:help@roadbuddy.com" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <Mail className="w-4 h-4" /> help@roadbuddy.com
              </a>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" /> Available Nationwide
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">© 2026 RoadBuddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { toast } from "sonner";
import IndianPhoneInput from "@/components/IndianPhoneInput";
import LocationPicker from "@/components/LocationPicker";
import { supabase } from "@/integrations/supabase/client";

const serviceOptions = [
  "Tyre Puncture Repair",
  "Car Mechanics",
  "Bike Mechanics",
  "Battery Jumpstart",
  "Fuel Delivery",
  "Towing Services",
];

const radiusOptions = ["5 km", "10 km", "15 km", "20 km", "30 km+"];

const JoinPartner = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    garageLocation: "",
    radius: "",
    availability: "",
  });

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      toast.error("Please select at least one service.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Enter a valid Indian mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("partner_applications").insert({
        name: formData.name.trim(),
        phone: `+91${formData.phone.replace(/\D/g, "")}`,
        garage_address: formData.garageLocation.trim(),
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        travel_radius: formData.radius || null,
        availability: formData.availability || null,
        services: selectedServices,
      });

      if (error) throw error;
      toast.success("Partner application submitted! We'll review and get back to you.");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Application Received!</h2>
            <p className="text-muted-foreground mb-8">
              Our team will review your application and contact you within 24-48 hours.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="border-border text-foreground hover:bg-secondary">
              Submit Another
            </Button>
          </motion.div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
                <Handshake className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Become a <span className="text-gradient-primary">Partner</span>
              </h1>
            </div>
            <p className="text-muted-foreground mb-8 ml-[52px]">
              Join our network and help stranded travelers in your area.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card rounded-xl border border-border p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name</Label>
                  <Input
                    id="name"
                    required
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                  <IndianPhoneInput
                    id="phone"
                    required
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="garage" className="text-foreground">Garage / Workshop Location</Label>
                <LocationPicker
                  id="garage"
                  required
                  address={formData.garageLocation}
                  onAddressChange={(v) => setFormData({ ...formData, garageLocation: v })}
                  onLocationDetected={(data) => setCoords({ lat: data.latitude, lng: data.longitude })}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-foreground">Services Offered</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {serviceOptions.map((service) => (
                    <label
                      key={service}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedServices.includes(service)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/50 hover:border-muted-foreground"
                      }`}
                    >
                      <Checkbox
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <span className="text-sm text-foreground">{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Travel Radius</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, radius: v })}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="How far can you travel?" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {radiusOptions.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Availability</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, availability: v })}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="When are you available?" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="24/7">24/7</SelectItem>
                      <SelectItem value="daytime">Daytime Only (6AM - 10PM)</SelectItem>
                      <SelectItem value="weekdays">Weekdays Only</SelectItem>
                      <SelectItem value="weekends">Weekends Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full gradient-primary text-primary-foreground glow-primary font-bold text-lg py-6"
              >
                <Handshake className="w-5 h-5 mr-2" />
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
      <Footer />
      <ChatbotWidget />
    </div>
  );
};

export default JoinPartner;

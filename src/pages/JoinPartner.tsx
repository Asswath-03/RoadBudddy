import { useState } from "react";
import {
  Button
} from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Handshake, CheckCircle, MapPin, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import ParallaxBackground from "@/components/ParallaxBackground";
import { toast } from "sonner";
import IndianPhoneInput from "@/components/IndianPhoneInput";
import { supabase } from "@/integrations/supabase/client";

const serviceOptions = [
  "Tyre Puncture Repair",
  "Car Mechanics",
  "Bike Mechanics",
  "Battery Jumpstart / Replacement",
  "Fuel Delivery",
  "Towing Services",
  "AC / Electrical Repair",
  "Engine Overhaul",
];

const JoinPartner = () => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    garageName: "",
    address: "",
    latitude: "",
    longitude: "",
    experienceYears: "",
  });

  const toggleService = (s: string) =>
    setSelectedServices((p) =>
      p.includes(s) ? p.filter((x) => x !== s) : [...p, s]
    );

  const detectCoords = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setFormData((f) => ({
          ...f,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6),
        }));
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "User-Agent": "RoadBuddy/1.0" } }
          );
          const data = await res.json();
          const a = data.address || {};
          const parts = [a.road, a.neighbourhood || a.suburb, a.city || a.town || a.village, a.state]
            .filter(Boolean);
          if (parts.length)
            setFormData((f) => ({ ...f, address: parts.join(", ") }));
          toast.success("📍 Garage location detected.");
        } catch {
          toast.success("Coordinates captured.");
        }
        setLocating(false);
      },
      () => {
        toast.error("Could not detect location. Enter coordinates manually.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
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
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error("Enter a valid email address.");
      return;
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    setSubmitting(true);
    try {
      // 1. Save to mechanic_applications
      const { data: inserted, error: insertErr } = await supabase
        .from("mechanic_applications" as any)
        .insert({
          name: formData.name.trim(),
          phone_number: `+91${formData.phone.replace(/\D/g, "")}`,
          email: formData.email.trim(),
          garage_name: formData.garageName.trim(),
          services: selectedServices.join(", "),
          address: formData.address.trim(),
          latitude: isNaN(lat) ? null : lat,
          longitude: isNaN(lng) ? null : lng,
          experience_years: parseInt(formData.experienceYears) || 0,
          status: "pending",
        })
        .select()
        .single();

      if (insertErr) throw insertErr;

      // 2. Send admin email notification via FormSubmit (no API key needed)
      try {
        await fetch("https://formsubmit.co/ajax/helproadbuddy@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            _subject: "🔧 New Mechanic Registration – RoadBuddy",
            _template: "table",
            _captcha: "false",
            Name: formData.name.trim(),
            Phone: `+91${formData.phone.replace(/\D/g, "")}`,
            Email: formData.email.trim(),
            Garage: formData.garageName.trim(),
            Address: formData.address.trim(),
            Services: selectedServices.join(", "),
            Experience: `${formData.experienceYears} years`,
            Latitude: formData.latitude || "not provided",
            Longitude: formData.longitude || "not provided",
            "Review at": "http://localhost:8080/admin",
          }),
        });
        console.log("[Email] Admin notification sent via FormSubmit");
      } catch (emailErr) {
        console.warn("[Email] FormSubmit failed (non-critical):", emailErr);
        // Don't throw – DB save already succeeded
      }

      toast.success("Application submitted! Our team will review it within 24–48 hours.");
      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFormData((f) => ({ ...f, [key]: e.target.value }));

  /* ── Success screen ── */
  if (submitted) {
    return (
      <ParallaxBackground fixedOverlay={<><Navbar /><ChatbotWidget /></>}>
        <div className="min-h-screen">
          <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center max-w-md mx-auto px-4"
            >
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Application Received!
              </h2>
              <p className="text-muted-foreground mb-2">
                Your application has been sent to our team for review.
              </p>
              <p className="text-muted-foreground mb-8">
                You will receive an email at <strong>{formData.email}</strong> once approved.
              </p>
              <Button onClick={() => setSubmitted(false)} variant="outline" className="border-border text-foreground">
                Submit Another
              </Button>
            </motion.div>
          </div>
          <Footer />
        </div>
      </ParallaxBackground>
    );
  }

  /* ── Form ── */
  return (
    <ParallaxBackground fixedOverlay={<><Navbar /><ChatbotWidget /></>}>
      <div className="min-h-screen">
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
                Join our network of verified mechanics and help stranded drivers in your area.
              </p>

              <form
                onSubmit={handleSubmit}
                className="space-y-6 bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0] shadow-[0_4px_16px_rgb(0_0_0/0.06)]"
              >
                {/* Name + Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                    <Input id="name" required placeholder="Your full name" value={formData.name}
                      onChange={set("name")} className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                    <IndianPhoneInput id="phone" required value={formData.phone}
                      onChange={(v) => setFormData((f) => ({ ...f, phone: v }))} />
                  </div>
                </div>

                {/* Email + Garage Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                    <Input id="email" type="email" required placeholder="you@email.com"
                      value={formData.email} onChange={set("email")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="garageName" className="text-foreground">Garage / Workshop Name *</Label>
                    <Input id="garageName" required placeholder="e.g. Kumar Auto Works"
                      value={formData.garageName} onChange={set("garageName")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                {/* Address + detect */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">Garage Address *</Label>
                  <div className="flex gap-2">
                    <Input id="address" required placeholder="Full address of your garage"
                      value={formData.address} onChange={set("address")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground flex-1" />
                    <Button type="button" variant="outline" onClick={detectCoords} disabled={locating}
                      className="shrink-0 border-primary text-primary hover:bg-primary/10">
                      {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Lat + Lng + Experience */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="lat" className="text-foreground">Latitude</Label>
                    <Input id="lat" placeholder="e.g. 12.9716"
                      value={formData.latitude} onChange={set("latitude")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lng" className="text-foreground">Longitude</Label>
                    <Input id="lng" placeholder="e.g. 77.5946"
                      value={formData.longitude} onChange={set("longitude")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exp" className="text-foreground">Years of Experience *</Label>
                    <Input id="exp" type="number" min="0" max="50" required
                      placeholder="e.g. 5" value={formData.experienceYears} onChange={set("experienceYears")}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground" />
                  </div>
                </div>

                {/* Services */}
                <div className="space-y-3">
                  <Label className="text-foreground">Services Offered *</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {serviceOptions.map((svc) => (
                      <label
                        key={svc}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedServices.includes(svc)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary/50 hover:border-muted-foreground"
                          }`}
                      >
                        <Checkbox
                          checked={selectedServices.includes(svc)}
                          onCheckedChange={() => toggleService(svc)}
                        />
                        <span className="text-sm text-foreground">{svc}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <Button
                  type="submit" size="lg" disabled={submitting}
                  className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-lg py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Submitting…</>
                  ) : (
                    <><Handshake className="w-5 h-5 mr-2" />Submit Application</>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  After submission, an admin will review your details and notify you at your email within 24–48 hours.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
        <Footer />
      </div>
    </ParallaxBackground>
  );
};

export default JoinPartner;

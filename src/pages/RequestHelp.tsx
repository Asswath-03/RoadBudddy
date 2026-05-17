import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MapPin, Send, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import ParallaxBackground from "@/components/ParallaxBackground";
import NearbyMechanics from "@/components/NearbyMechanics";
import { toast } from "sonner";
import IndianPhoneInput from "@/components/IndianPhoneInput";

const issueTypes = [
  "Tyre Puncture",
  "Engine Failure",
  "Battery Dead",
  "Out of Fuel",
  "Accident",
  "Towing Needed",
  "Other",
];

const vehicleTypes = ["Car", "Bike", "Truck", "SUV", "Van", "Other"];

const RequestHelp = () => {
  const [submitted, setSubmitted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    location: "",
    vehicleType: "",
    issueType: "",
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/\D/g, ""))) {
      toast.error("Enter a valid Indian mobile number.");
      return;
    }
    toast.success("Help request submitted! A mechanic will be assigned shortly.");
    setSubmitted(true);
  };

  const detectLocation = () => {
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support GPS location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        // Reverse geocode to human-readable address via Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            { headers: { "User-Agent": "RoadBuddy/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const parts = [
            addr.road,
            addr.neighbourhood || addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
          ].filter(Boolean);
          const readable = parts.length > 0
            ? parts.join(", ")
            : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setFormData((prev) => ({ ...prev, location: readable }));
          toast.success("📍 Location detected: " + readable.split(",")[0]);
        } catch {
          const raw = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
          setFormData((prev) => ({ ...prev, location: raw }));
          toast.success("Location detected.");
        }
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        const msgs: Record<number, string> = {
          1: "Location permission denied. Please allow location access in your browser settings and try again.",
          2: "GPS signal unavailable. Move to an open area or enter your address manually.",
          3: "Location detection timed out. Please try again or enter address manually.",
        };
        const msg = msgs[err.code] || "Unable to detect location. Please enter manually.";
        setLocationError(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  if (submitted) {
    return (
      <ParallaxBackground fixedOverlay={<><Navbar /><ChatbotWidget /></>}>
        <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-md mx-auto px-4"
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">Help is on the way!</h2>
            <p className="text-muted-foreground mb-8">
              Your request has been received. We're matching you with the nearest available mechanic.
            </p>
            <Button onClick={() => setSubmitted(false)} variant="outline" className="border-border text-foreground hover:bg-secondary">
              Submit Another Request
            </Button>
          </motion.div>
        </div>
        <Footer />
      </ParallaxBackground>
    );
  }

  return (
    <ParallaxBackground fixedOverlay={<><Navbar /><ChatbotWidget /></>}>
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#1D4ED8] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#0F172A]">
                Request <span className="text-[#1D4ED8]">Help</span>
              </h1>
            </div>
            <p className="text-muted-foreground mb-8 ml-[52px]">
              Tell us what happened and we'll dispatch help immediately.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl p-6 md:p-8 border border-[#E2E8F0] shadow-[0_4px_16px_rgb(0_0_0/0.06)]">
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

              {/* Location field with robust GPS detection */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Breakdown Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    required
                    placeholder="Enter address or tap Detect GPS"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={detectLocation}
                    disabled={locating}
                    className="border-primary text-primary hover:bg-primary/10 shrink-0 min-w-[100px]"
                  >
                    {locating ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Detecting</>
                    ) : (
                      <><MapPin className="w-4 h-4 mr-1" />Detect GPS</>
                    )}
                  </Button>
                </div>
                {locationError && (
                  <p className="text-xs text-destructive flex items-start gap-1 mt-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
                    {locationError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-foreground">Vehicle Type</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, vehicleType: v })}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {vehicleTypes.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Issue Type</Label>
                  <Select onValueChange={(v) => setFormData({ ...formData, issueType: v })}>
                    <SelectTrigger className="bg-secondary border-border text-foreground">
                      <SelectValue placeholder="What happened?" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {issueTypes.map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-foreground">Additional Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any extra details about the breakdown..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground min-h-[100px]"
                />
              </div>

              <Button type="submit" size="lg" className="w-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold text-lg py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300">
                <Send className="w-5 h-5 mr-2" />
                Send Help Request
              </Button>
            </form>

            {/* Nearby Mechanics Section */}
            <div className="mt-10">
              <NearbyMechanics />
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </ParallaxBackground>
  );
};

export default RequestHelp;

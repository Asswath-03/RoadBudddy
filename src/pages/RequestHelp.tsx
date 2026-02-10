import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, MapPin, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotWidget from "@/components/ChatbotWidget";
import { toast } from "sonner";

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
    // In a real app, this would call the backend
    toast.success("Help request submitted! A mechanic will be assigned shortly.");
    setSubmitted(true);
  };

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
          }));
          toast.success("Location detected!");
        },
        () => toast.error("Unable to detect location. Please enter manually.")
      );
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
              <div className="w-10 h-10 rounded-lg gradient-emergency flex items-center justify-center animate-pulse-glow">
                <AlertTriangle className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                Request <span className="text-gradient-emergency">Help</span>
              </h1>
            </div>
            <p className="text-muted-foreground mb-8 ml-[52px]">
              Tell us what happened and we'll dispatch help immediately.
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
                  <Input
                    id="phone"
                    required
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="text-foreground">Breakdown Location</Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    required
                    placeholder="Enter address or detect GPS"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground flex-1"
                  />
                  <Button type="button" variant="outline" onClick={detectLocation} className="border-primary text-primary hover:bg-primary/10 shrink-0">
                    <MapPin className="w-4 h-4 mr-1" /> Detect
                  </Button>
                </div>
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

              <Button type="submit" size="lg" className="w-full gradient-emergency text-primary-foreground glow-emergency font-bold text-lg py-6">
                <Send className="w-5 h-5 mr-2" />
                Send Help Request
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

export default RequestHelp;

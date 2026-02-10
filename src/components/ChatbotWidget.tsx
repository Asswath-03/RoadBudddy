import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "bot" | "user";
  text: string;
}

const quickReplies = [
  "I need roadside help",
  "I want to become a partner",
  "What services do you offer?",
  "How fast is help?",
];

const getBotResponse = (input: string): string => {
  const lower = input.toLowerCase();
  if (lower.includes("help") || lower.includes("sos") || lower.includes("breakdown") || lower.includes("stuck"))
    return "I'm sorry you're stranded! Head to our **Request Help** page to submit your location and issue — we'll dispatch the nearest mechanic right away. 🚗";
  if (lower.includes("partner") || lower.includes("mechanic") || lower.includes("join") || lower.includes("register"))
    return "Great to hear! You can sign up on our **Become a Partner** page. We'll review your application within 24-48 hours. 🔧";
  if (lower.includes("service") || lower.includes("offer"))
    return "We offer: **Tyre repair, Car & Bike mechanics, Battery jumpstart, Fuel delivery, and Towing services** — all on-demand!";
  if (lower.includes("fast") || lower.includes("time") || lower.includes("long"))
    return "Our average response time is **under 15 minutes**. We match you with the closest available mechanic instantly!";
  if (lower.includes("price") || lower.includes("cost") || lower.includes("fee"))
    return "Pricing depends on the service and distance. You'll get a transparent quote before confirming. No hidden fees!";
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey"))
    return "Hey there! 👋 I'm RoadBuddy Bot. Need roadside help or want to join as a partner? I'm here to assist!";
  return "I can help you with requesting roadside assistance or joining as a partner mechanic. What would you like to know?";
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hi! 👋 I'm the RoadBuddy assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", text };
    const botMsg: Message = { role: "bot", text: getBotResponse(text) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Toggle */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-primary glow-primary flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            <MessageCircle className="w-6 h-6 text-primary-foreground" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-4rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="gradient-primary px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">RoadBuddy Bot</p>
                  <p className="text-xs text-primary-foreground/70">Always online</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "gradient-primary text-primary-foreground rounded-br-sm"
                        : "bg-secondary text-secondary-foreground rounded-bl-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Quick replies */}
            {messages.length <= 2 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => sendMessage(qr)}
                    className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Type a message..."
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground text-sm"
              />
              <Button size="icon" onClick={() => sendMessage(input)} className="gradient-primary text-primary-foreground shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
